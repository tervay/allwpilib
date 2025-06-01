import fs from "node:fs/promises";

// Use readFile to read contents of the "add.wasm" file
const wasmBuffer = await fs.readFile(
  "./build-cmake-emscripten/bin/wpimath.wasm"
);

// Use the WebAssembly.instantiate method to instantiate the WebAssembly module
const wasmModule = await WebAssembly.instantiate(wasmBuffer, {
  env: {},
  "GOT.mem": {},
  "GOT.func": {},
});

console.log(wasmModule);
