# rm -rf build-cmake-emscripten

emcmake cmake -B build-cmake-emscripten -S . \
  -DCMAKE_BUILD_TYPE=Release \
  -DBUILD_SHARED_LIBS=OFF \
  -DNO_WERROR=ON \
  -DWITH_CSCORE=OFF \
  -DWITH_EXAMPLES=ON \
  -DWITH_GUI=OFF \
  -DWITH_PROTOBUF=OFF \
  -DWITH_SIMULATION_MODULES=OFF \
  -DWITH_TESTS=OFF

cd build-cmake-emscripten

emmake cmake --build . --parallel 12 --target wasm_main

cd ../
