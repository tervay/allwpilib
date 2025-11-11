#!/bin/bash
# Build script for compiling wpimath to WebAssembly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Emscripten is installed
if ! command -v emcc &> /dev/null; then
    echo -e "${RED}Error: Emscripten not found. Please install Emscripten first.${NC}"
    echo "Visit: https://emscripten.org/docs/getting_started/downloads.html"
    exit 1
fi

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"
WASM_DIR="$SCRIPT_DIR"
BUILD_DIR="$PROJECT_ROOT/build-wasm"

echo -e "${GREEN}Building wpimath for WebAssembly...${NC}"

# Create build directory
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

# Configure with Emscripten
echo -e "${YELLOW}Configuring CMake with Emscripten...${NC}"
cmake "$PROJECT_ROOT" \
    -DCMAKE_TOOLCHAIN_FILE="$WASM_DIR/emscripten_toolchain.cmake" \
    -DCMAKE_BUILD_TYPE=Release \
    -DWITH_JAVA=OFF \
    -DWITH_TESTS=OFF \
    -DWITH_WPIMATH=ON \
    -DWITH_WPIUNITS=OFF \
    -DWITH_WPILIB=OFF \
    -DWITH_CSCORE=OFF \
    -DWITH_NTCORE=OFF \
    -DWITH_EXAMPLES=OFF \
    -DWITH_GUI=OFF \
    -DWITH_SIMULATION_MODULES=OFF \
    -DBUILD_SHARED_LIBS=OFF

# Build wpiutil first (dependency)
echo -e "${YELLOW}Building wpiutil...${NC}"
cmake --build . --target wpiutil -j$(nproc)

# Build wpimath (this will also build wpimath_wasm since it's a subdirectory)
echo -e "${YELLOW}Building wpimath and WebAssembly module...${NC}"
cmake --build . --target wpimath_wasm -j$(nproc)

# Copy output files
echo -e "${YELLOW}Copying output files...${NC}"
mkdir -p "$WASM_DIR/dist"
mkdir -p "$WASM_DIR/typescript"
if [ -f "$BUILD_DIR/wpimath/wasm/wpimath_wasm.js" ]; then
    cp "$BUILD_DIR/wpimath/wasm/wpimath_wasm.js" "$WASM_DIR/dist/"
    cp "$BUILD_DIR/wpimath/wasm/wpimath_wasm.wasm" "$WASM_DIR/dist/" 2>/dev/null || true
    
    # Copy auto-generated TypeScript definitions (if generated)
    if [ -f "$BUILD_DIR/wpimath/wasm/wpimath_wasm.d.ts" ]; then
        cp "$BUILD_DIR/wpimath/wasm/wpimath_wasm.d.ts" "$WASM_DIR/typescript/wpimath.emscripten.d.ts"
        echo -e "${GREEN}TypeScript definitions generated!${NC}"
    fi
    
    echo -e "${GREEN}Files copied successfully!${NC}"
else
    echo -e "${RED}Error: wpimath_wasm.js not found in expected location${NC}"
    echo -e "${YELLOW}Expected: $BUILD_DIR/wpimath/wasm/wpimath_wasm.js${NC}"
    exit 1
fi

echo -e "${GREEN}Build complete!${NC}"
echo -e "${GREEN}Output files are in: $WASM_DIR/dist/${NC}"

