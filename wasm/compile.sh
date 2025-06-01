#!/bin/bash

# Define paths relative to the allwpilib root directory
WPILIB_ROOT=".."  # Assuming you're in a subdirectory of allwpilib

# Include paths for WPILib headers
INCLUDE_FLAGS=(
  "-I${WPILIB_ROOT}/wpiutil/src/main/native/include"
  "-I${WPILIB_ROOT}/wpimath/src/main/native/include"
  "-I${WPILIB_ROOT}/wpilibc/src/main/native/include"
)

# Libraries to link
WPIMATH_LIB="${WPILIB_ROOT}/build-cmake-emscripten/lib/libwpimath.a"
WPIUTIL_LIB="${WPILIB_ROOT}/build-cmake-emscripten/lib/libwpiutil.a"

# Compile the wrapper with Emscripten
emcc wpilib_pose_wrapper.cpp \
  "${WPIMATH_LIB}" \
  "${WPIUTIL_LIB}" \
  -o wpilib_pose.js \
  -s WASM=1 \
  -s EXPORTED_FUNCTIONS='["_add","_createRotation2d","_getRotation2dRadians","_deleteRotation2d"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  "${INCLUDE_FLAGS[@]}" \
  -O2

echo "Compilation complete. Output files: wpilib_pose.js and wpilib_pose.wasm"