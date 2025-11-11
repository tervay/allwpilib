/**
 * TypeScript wrapper for wpimath WebAssembly module
 */

import type { WpimathModule, ModuleFactory, Pose2d as Pose2dData } from './wpimath';

let moduleInstance: WpimathModule | null = null;
let modulePromise: Promise<WpimathModule> | null = null;

/**
 * Initialize the wpimath WebAssembly module
 * @param moduleFactory Optional factory function (defaults to global createWpimathModule)
 * @returns Promise that resolves to the wpimath module
 */
export async function initWpimath(
  moduleFactory?: ModuleFactory
): Promise<WpimathModule> {
  if (moduleInstance) {
    return moduleInstance;
  }

  if (modulePromise) {
    return modulePromise;
  }

  modulePromise = (async () => {
    const factory = moduleFactory || (globalThis as any).createWpimathModule;
    
    if (!factory) {
      throw new Error(
        'wpimath module not found. Make sure to load wpimath_wasm.js before calling initWpimath.'
      );
    }

    const instance = await factory();
    moduleInstance = instance;
    return instance;
  })();

  return modulePromise;
}

/**
 * Get the initialized wpimath module instance
 * @throws Error if module is not initialized
 */
export function getWpimathModule(): WpimathModule {
  if (!moduleInstance) {
    throw new Error(
      'wpimath module not initialized. Call initWpimath() first.'
    );
  }
  return moduleInstance;
}

// Re-export types (rename Pose2d to Pose2dData to avoid conflict with class)
export type {
  WpimathModule,
  Pose2d as Pose2dData,
  ChassisSpeeds,
  WheelSpeeds,
  TrajectoryState,
  TrajectoryConfig,
  Translation2d,
} from './wpimath';

// Export convenience classes
export class Pose2d {
  private instance: any;

  constructor(x: number, y: number, rotation: number) {
    const Module = getWpimathModule();
    this.instance = new Module.Pose2d(x, y, rotation);
  }

  get x(): number {
    return this.instance.x;
  }

  get y(): number {
    return this.instance.y;
  }

  get rotation(): number {
    return this.instance.rotation;
  }

  transformBy(other: Pose2d): Pose2d {
    const result = this.instance.transformBy(other.instance);
    return new Pose2d(result.x, result.y, result.rotation);
  }

  distanceTo(other: Pose2d): number {
    return this.instance.distanceTo(other.instance);
  }
}

export class PIDController {
  private instance: any;

  constructor(kp: number, ki: number, kd: number) {
    const Module = getWpimathModule();
    this.instance = new Module.PIDController(kp, ki, kd);
  }

  calculate(measurement: number, setpoint: number): number {
    return this.instance.calculate(measurement, setpoint);
  }

  reset(): void {
    this.instance.reset();
  }

  setPID(kp: number, ki: number, kd: number): void {
    this.instance.setPID(kp, ki, kd);
  }

  getPositionError(): number {
    return this.instance.getPositionError();
  }

  getVelocityError(): number {
    return this.instance.getVelocityError();
  }

  atSetpoint(): boolean {
    return this.instance.atSetpoint();
  }
}

export class DifferentialDriveKinematics {
  private instance: any;

  constructor(trackWidth: number) {
    const Module = getWpimathModule();
    this.instance = new Module.DifferentialDriveKinematics(trackWidth);
  }

  toChassisSpeeds(leftSpeed: number, rightSpeed: number): import('./wpimath').ChassisSpeeds {
    return this.instance.toChassisSpeeds(leftSpeed, rightSpeed);
  }

  toWheelSpeeds(vx: number, vy: number, omega: number): import('./wpimath').WheelSpeeds {
    return this.instance.toWheelSpeeds(vx, vy, omega);
  }
}

export class LinearFilter {
  private instance: any;

  private constructor(instance: any) {
    this.instance = instance;
  }

  static movingAverage(taps: number): LinearFilter {
    const Module = getWpimathModule();
    return new LinearFilter(Module.LinearFilter.movingAverage(taps));
  }

  static singlePoleIIR(timeConstant: number, period: number): LinearFilter {
    const Module = getWpimathModule();
    return new LinearFilter(Module.LinearFilter.singlePoleIIR(timeConstant, period));
  }

  calculate(input: number): number {
    return this.instance.calculate(input);
  }

  reset(): void {
    this.instance.reset();
  }
}

export class Trajectory {
  private instance: any;

  constructor(instance?: any) {
    const Module = getWpimathModule();
    this.instance = instance || new Module.Trajectory();
  }

  getState(time: number): import('./wpimath').TrajectoryState {
    return this.instance.getState(time);
  }

  getTotalTime(): number {
    return this.instance.getTotalTime();
  }

  getStates(): import('./wpimath').TrajectoryState[] {
    return this.instance.getStates();
  }
}

export class TrajectoryGenerator {
  static generateTrajectory(
    startPose: Pose2dData,
    interiorWaypoints: import('./wpimath').Translation2d[],
    endPose: Pose2dData,
    config: import('./wpimath').TrajectoryConfig
  ): Trajectory {
    const Module = getWpimathModule();
    const trajectory = Module.TrajectoryGenerator.generateTrajectory(
      startPose,
      interiorWaypoints,
      endPose,
      config
    );
    return new Trajectory(trajectory);
  }
}

export const MathUtil = {
  inputModulus: (input: number, minimumInput: number, maximumInput: number): number => {
    const Module = getWpimathModule();
    return Module.MathUtil.inputModulus(input, minimumInput, maximumInput);
  },
  angleModulus: (angleDegree: number): number => {
    const Module = getWpimathModule();
    return Module.MathUtil.angleModulus(angleDegree);
  },
};

