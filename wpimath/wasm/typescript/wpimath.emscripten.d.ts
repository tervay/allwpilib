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
export interface MathUtil extends ClassHandle {
}

export interface Pose2d extends ClassHandle {
  x: number;
  y: number;
  rotation: number;
  transformBy(_0: Pose2d): Pose2d;
  distanceTo(_0: Pose2d): number;
}

export interface PIDController extends ClassHandle {
  reset(): void;
  atSetpoint(): boolean;
  calculate(_0: number, _1: number): number;
  setPID(_0: number, _1: number, _2: number): void;
  getPositionError(): number;
  getVelocityError(): number;
}

export interface DifferentialDriveKinematics extends ClassHandle {
  toChassisSpeeds(_0: number, _1: number): any;
  toWheelSpeeds(_0: number, _1: number, _2: number): any;
}

export interface LinearFilter extends ClassHandle {
  reset(): void;
  calculate(_0: number): number;
}

export interface Trajectory extends ClassHandle {
  getTotalTime(): number;
  getState(_0: number): any;
  getStates(): any;
}

export interface TrajectoryGenerator extends ClassHandle {
}

interface EmbindModule {
  MathUtil: {
    inputModulus(_0: number, _1: number, _2: number): number;
    angleModulus(_0: number): number;
  };
  Pose2d: {
    new(_0: number, _1: number, _2: number): Pose2d;
  };
  PIDController: {
    new(_0: number, _1: number, _2: number): PIDController;
  };
  DifferentialDriveKinematics: {
    new(_0: number): DifferentialDriveKinematics;
  };
  LinearFilter: {
    movingAverage(_0: number): LinearFilter | null;
    singlePoleIIR(_0: number, _1: number): LinearFilter | null;
  };
  Trajectory: {
    new(): Trajectory;
  };
  TrajectoryGenerator: {
    generateTrajectory(_0: any, _1: any, _2: any, _3: any): Trajectory | null;
  };
}

export type MainModule = WasmModule & typeof RuntimeExports & EmbindModule;
export default function MainModuleFactory (options?: unknown): Promise<MainModule>;
