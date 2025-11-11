// TypeScript bindings for emscripten-generated code.  Automatically generated at compile time.
declare namespace RuntimeExports {
    /**
     * @param {string|null=} returnType
     * @param {Array=} argTypes
     * @param {Arguments|Array=} args
     * @param {Object=} opts
     */
    function ccall(ident: any, returnType?: (string | null) | undefined, argTypes?: any[] | undefined, args?: (Arguments | any[]) | undefined, opts?: any | undefined): any;
    /**
     * @param {string=} returnType
     * @param {Array=} argTypes
     * @param {Object=} opts
     */
    function cwrap(ident: any, returnType?: string | undefined, argTypes?: any[] | undefined, opts?: any | undefined): any;
    /**
     * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
     * emscripten HEAP, returns a copy of that string as a Javascript String object.
     *
     * @param {number} ptr
     * @param {number=} maxBytesToRead - An optional length that specifies the
     *   maximum number of bytes to read. You can omit this parameter to scan the
     *   string until the first 0 byte. If maxBytesToRead is passed, and the string
     *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
     *   string will cut short at that byte index (i.e. maxBytesToRead will not
     *   produce a string of exact length [ptr, ptr+maxBytesToRead[) N.B. mixing
     *   frequent uses of UTF8ToString() with and without maxBytesToRead may throw
     *   JS JIT optimizations off, so it is worth to consider consistently using one
     * @return {string}
     */
    function UTF8ToString(ptr: number, maxBytesToRead?: number | undefined): string;
    function stringToUTF8(str: any, outPtr: any, maxBytesToWrite: any): any;
    let HEAPF32: any;
    let HEAPF64: any;
    let HEAP_DATA_VIEW: any;
    let HEAP8: any;
    let HEAPU8: any;
    let HEAP16: any;
    let HEAPU16: any;
    let HEAP32: any;
    let HEAPU32: any;
    let HEAP64: any;
    let HEAPU64: any;
}
interface WasmModule {
  _free(_0: number): void;
  _malloc(_0: number): number;
}

export interface ClassHandle {
  isAliasOf(other: ClassHandle): boolean;
  delete(): void;
  deleteLater(): this;
  isDeleted(): boolean;
  clone(): this;
}
export interface DCMotor extends ClassHandle {
}

export interface ElevatorSim extends ClassHandle {
  hasHitLowerLimit(): boolean;
  hasHitUpperLimit(): boolean;
  setInputVoltage(_0: number): void;
  update(_0: number): void;
  getPosition(): number;
  getVelocity(): number;
  getCurrentDraw(): number;
  setState(_0: number, _1: number): void;
  wouldHitLowerLimit(_0: number): boolean;
  wouldHitUpperLimit(_0: number): boolean;
}

interface EmbindModule {
  DCMotor: {
    vex775Pro(_0: number): DCMotor | null;
    cim(_0: number): DCMotor | null;
    neo(_0: number): DCMotor | null;
    miniCIM(_0: number): DCMotor | null;
    bag(_0: number): DCMotor | null;
    falcon500(_0: number): DCMotor | null;
  };
  ElevatorSim: {
    new(_0: DCMotor | null, _1: number, _2: number, _3: number, _4: number, _5: number, _6: boolean, _7: number): ElevatorSim;
  };
  RoboRioSim_setVInVoltage(_0: number): void;
  RoboRioSim_getVInVoltage(): number;
}

export type MainModule = WasmModule & typeof RuntimeExports & EmbindModule;
export default function MainModuleFactory (options?: unknown): Promise<MainModule>;
