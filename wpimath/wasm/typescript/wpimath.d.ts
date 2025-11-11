/**
 * TypeScript definitions for wpimath WebAssembly module
 */

export interface Pose2d {
  x: number;
  y: number;
  rotation: number; // degrees
}

export interface ChassisSpeeds {
  vx: number;
  vy: number;
  omega: number;
}

export interface WheelSpeeds {
  left: number;
  right: number;
}

export interface TrajectoryState {
  time: number;
  velocity: number;
  acceleration: number;
  pose: Pose2d;
}

export interface TrajectoryConfig {
  maxVelocity: number;
  maxAcceleration: number;
}

export interface Translation2d {
  x: number;
  y: number;
}

declare class MathUtil {
  static inputModulus(input: number, minimumInput: number, maximumInput: number): number;
  static angleModulus(angleDegree: number): number;
}

declare class Pose2dClass {
  x: number;
  y: number;
  rotation: number;

  constructor(x: number, y: number, rotation: number);
  transformBy(other: Pose2dClass): Pose2dClass;
  distanceTo(other: Pose2dClass): number;
}

declare class PIDController {
  constructor(kp: number, ki: number, kd: number);
  calculate(measurement: number, setpoint: number): number;
  reset(): void;
  setPID(kp: number, ki: number, kd: number): void;
  getPositionError(): number;
  getVelocityError(): number;
  atSetpoint(): boolean;
}

declare class DifferentialDriveKinematics {
  constructor(trackWidth: number);
  toChassisSpeeds(leftSpeed: number, rightSpeed: number): ChassisSpeeds;
  toWheelSpeeds(vx: number, vy: number, omega: number): WheelSpeeds;
}

declare class LinearFilter {
  static movingAverage(taps: number): LinearFilter;
  static singlePoleIIR(timeConstant: number, period: number): LinearFilter;
  calculate(input: number): number;
  reset(): void;
}

declare class Trajectory {
  constructor();
  getState(time: number): TrajectoryState;
  getTotalTime(): number;
  getStates(): TrajectoryState[];
}

declare class TrajectoryGenerator {
  static generateTrajectory(
    startPose: Pose2d,
    interiorWaypoints: Translation2d[],
    endPose: Pose2d,
    config: TrajectoryConfig
  ): Trajectory;
}

export interface WpimathModule {
  MathUtil: typeof MathUtil;
  Pose2d: typeof Pose2dClass;
  PIDController: typeof PIDController;
  DifferentialDriveKinematics: typeof DifferentialDriveKinematics;
  LinearFilter: typeof LinearFilter;
  Trajectory: typeof Trajectory;
  TrajectoryGenerator: typeof TrajectoryGenerator;
}

export interface ModuleFactory {
  (): Promise<WpimathModule>;
}

declare function createWpimathModule(): Promise<WpimathModule>;

export default createWpimathModule;

