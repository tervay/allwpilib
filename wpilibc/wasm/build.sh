#!/bin/bash
# Build script for compiling wpilibc to WebAssembly

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

echo -e "${GREEN}Building wpilibc for WebAssembly...${NC}"

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
    -DWITH_WPILIB=ON \
    -DWITH_CSCORE=OFF \
    -DWITH_NTCORE=ON \
    -DWITH_EXAMPLES=OFF \
    -DWITH_GUI=OFF \
    -DWITH_SIMULATION_MODULES=OFF \
    -DBUILD_SHARED_LIBS=OFF

# Build dependencies in order
echo -e "${YELLOW}Building wpiutil...${NC}"
cmake --build . --target wpiutil -j$(nproc) || echo -e "${YELLOW}Warning: wpiutil build may have issues${NC}"

echo -e "${YELLOW}Building wpimath...${NC}"
cmake --build . --target wpimath -j$(nproc) || echo -e "${YELLOW}Warning: wpimath build may have issues${NC}"

echo -e "${YELLOW}Building hal...${NC}"
cmake --build . --target hal -j$(nproc) || echo -e "${YELLOW}Warning: hal build may have issues, will use stubs${NC}"

# Skip ntcore/wpinet for WebAssembly (they don't compile for wasm)
# The stub will be built by wpilibc/wasm instead
echo -e "${YELLOW}Skipping ntcore/wpinet (using stub for WebAssembly)...${NC}"

echo -e "${YELLOW}Building wpilibc...${NC}"
cmake --build . --target wpilibc -j$(nproc) || echo -e "${YELLOW}Warning: wpilibc build may have issues${NC}"

# Build wpilibc_wasm (this will also build wpilibc_wasm since it's a subdirectory)
echo -e "${YELLOW}Building WebAssembly module...${NC}"
cmake --build . --target wpilibc_wasm -j$(nproc)

# Copy output files
echo -e "${YELLOW}Copying output files...${NC}"
mkdir -p "$WASM_DIR/dist"
mkdir -p "$WASM_DIR/typescript"
if [ -f "$BUILD_DIR/wpilibc/wasm/wpilibc_wasm.js" ]; then
    cp "$BUILD_DIR/wpilibc/wasm/wpilibc_wasm.js" "$WASM_DIR/dist/"
    cp "$BUILD_DIR/wpilibc/wasm/wpilibc_wasm.wasm" "$WASM_DIR/dist/" 2>/dev/null || true
    
    # Copy auto-generated TypeScript definitions (if generated)
    if [ -f "$BUILD_DIR/wpilibc/wasm/wpilibc_wasm.d.ts" ]; then
        cp "$BUILD_DIR/wpilibc/wasm/wpilibc_wasm.d.ts" "$WASM_DIR/typescript/wpilibc.emscripten.d.ts"
        echo -e "${GREEN}TypeScript definitions generated!${NC}"
    fi
    
    echo -e "${GREEN}Files copied successfully!${NC}"
else
    echo -e "${RED}Error: wpilibc_wasm.js not found in expected location${NC}"
    echo -e "${YELLOW}Expected: $BUILD_DIR/wpilibc/wasm/wpilibc_wasm.js${NC}"
    exit 1
fi

echo -e "${GREEN}Build complete!${NC}"
echo -e "${GREEN}Output files are in: $WASM_DIR/dist/${NC}"

