/**
 * TypeScript Elevator class similar to the C++ example
 * Uses WebAssembly bindings for ElevatorSim, DCMotor, and PIDController
 */

import type { MainModule as WpilibcModule, DCMotor, ElevatorSim } from '../../../wpilibc/wasm/typescript/wpilibc.emscripten';
import type { MainModule as WpimathModule } from '../typescript/wpimath.emscripten';

// Constants matching the C++ example
namespace Constants {
  export const kElevatorKp = 5.0;
  export const kElevatorKi = 0.0;
  export const kElevatorKd = 0.0;

  export const kElevatorkS = 0.0;  // Static gain (volts)
  export const kElevatorkG = 0.762; // Gravity gain (volts)
  export const kElevatorkV = 0.762; // Velocity gain (V/(m/s))
  export const kElevatorkA = 0.0;   // Acceleration gain (V/(m/s²))

  export const kElevatorGearing = 10.0;
  export const kElevatorDrumRadius = 0.0508; // 2 inches in meters
  export const kCarriageMass = 4.0; // kg

  export const kMinElevatorHeight = 0.0; // meters
  export const kMaxElevatorHeight = 1.25; // meters

  // distance per pulse = (distance per revolution) / (pulses per revolution)
  //  = (Pi * D) / ppr
  export const kArmEncoderDistPerPulse = 2.0 * Math.PI * kElevatorDrumRadius / 4096.0;
}


/**
 * Elevator class that mirrors the C++ example
 */
export class Elevator {
  private wpilibc: WpilibcModule;
  private wpimath: WpimathModule;

  // Hardware simulation
  private m_elevatorGearbox: DCMotor;
  private m_elevatorSim: ElevatorSim;

  // Control
  private m_controller: any; // PIDController from wpimath
  private m_feedforward: any; // ElevatorFeedforward from wpimath

  // Simulated hardware state
  private m_encoderDistance: number = 0; // meters
  private m_motorVoltage: number = 0; // volts
  private m_motorSpeed: number = 0; // normalized speed (-1 to 1)
  private m_batteryVoltage: number = 12.0; // volts (simulated)

  // Telemetry
  private m_elevatorLength: number = 0; // meters (for visualization)

  constructor(wpilibc: WpilibcModule, wpimath: WpimathModule) {
    this.wpilibc = wpilibc;
    this.wpimath = wpimath;

    // Initialize battery voltage to 12V (required for ElevatorSim to work)
    // ElevatorSim::SetInputVoltage clamps to RobotController::GetBatteryVoltage()
    (wpilibc as any).RoboRioSim_setVInVoltage(12.0);

    // Create gearbox with 4 Vex 775 Pro motors
    const gearbox = wpilibc.DCMotor.vex775Pro(4);
    if (!gearbox) {
      throw new Error('Failed to create DCMotor');
    }
    this.m_elevatorGearbox = gearbox;

    // Create ElevatorSim
    this.m_elevatorSim = new wpilibc.ElevatorSim(
      this.m_elevatorGearbox,
      Constants.kElevatorGearing,
      Constants.kCarriageMass,
      Constants.kElevatorDrumRadius,
      Constants.kMinElevatorHeight,
      Constants.kMaxElevatorHeight,
      false,  // simulate gravity
      0.0    // starting height
    );

    // Create PID controller
    this.m_controller = new wpimath.PIDController(
      Constants.kElevatorKp,
      Constants.kElevatorKi,
      Constants.kElevatorKd
    );

    // Create feedforward using wasm implementation
    // Constructor supports: (kS, kG, kV), (kS, kG, kV, kA), or (kS, kG, kV, kA, dt)
    this.m_feedforward = new wpimath.ElevatorFeedforward(
      Constants.kElevatorkS,
      Constants.kElevatorkG,
      Constants.kElevatorkV,
      Constants.kElevatorkA
      // dt defaults to 0.020 (20ms) if not specified
    );
  }

  /**
   * Updates the simulation of what the elevator is doing.
   * Should be called periodically (typically every 20ms).
   */
  simulationPeriodic(): void {
    // Set input voltage based on motor speed and battery voltage
    // In the C++ example: m_elevatorSim.SetInput(m_motorSim.GetSpeed() * RobotController::GetInputVoltage())
    const inputVoltage = this.m_motorSpeed * this.m_batteryVoltage;
    this.m_elevatorSim.setInputVoltage(inputVoltage);

    // Update the elevator simulation (standard loop time is 20ms)
    this.m_elevatorSim.update(0.020); // 20ms

    // Update simulated encoder reading
    this.m_encoderDistance = this.m_elevatorSim.getPosition();

    // Simulate battery voltage drop based on current draw
    // In the C++ example: RoboRioSim::SetVInVoltage(BatterySim::Calculate({m_elevatorSim.GetCurrentDraw()}))
    // Simplified: assume battery voltage drops slightly with current
    const currentDraw = this.m_elevatorSim.getCurrentDraw();
    this.m_batteryVoltage = Math.max(10.0, 12.0 - currentDraw * 0.1); // Simple model
    
    // Update the actual battery voltage in the simulation
    // This is critical - ElevatorSim clamps input voltage to RobotController::GetBatteryVoltage()
    (this.wpilibc as any).RoboRioSim_setVInVoltage(this.m_batteryVoltage);
  }

  /**
   * Updates telemetry for visualization.
   */
  updateTelemetry(): void {
    // Update the elevator length based on the simulated elevator height
    this.m_elevatorLength = this.m_encoderDistance;
  }

  /**
   * Moves the elevator to a goal position using PID control and feedforward.
   * @param goal Goal position in meters
   */
  reachGoal(goal: number): void {
    // Set the goal for the PID controller
    // Note: PIDController doesn't have SetGoal, so we'll use the setpoint directly in calculate
    // For a proper implementation, we'd need ProfiledPIDController, but we'll use PIDController
    
    // Calculate PID output
    const pidOutput = this.m_controller.calculate(this.m_encoderDistance, goal);

    // Get the velocity setpoint (simplified - in real ProfiledPIDController this comes from the profile)
    // For now, we'll use the current velocity from the elevator sim
    const currentVelocity = this.m_elevatorSim.getVelocity();
    
    // Calculate feedforward output
    // In the C++ example: m_feedforward.Calculate(m_controller.GetSetpoint().velocity)
    // Since we don't have the setpoint velocity from PIDController, we'll use current velocity
    const feedforwardOutput = this.m_feedforward.calculate(currentVelocity);

    // Set motor voltage (PID output + feedforward)
    const totalVoltage = pidOutput + feedforwardOutput;
    
    // Clamp to battery voltage
    const clampedVoltage = Math.max(-this.m_batteryVoltage, Math.min(this.m_batteryVoltage, totalVoltage));
    
    // Convert voltage to normalized motor speed (-1 to 1)
    this.m_motorVoltage = clampedVoltage;
    this.m_motorSpeed = clampedVoltage / this.m_batteryVoltage;
  }

  /**
   * Stops the elevator.
   */
  stop(): void {
    // Set goal to 0
    this.m_controller.reset();
    
    // Set motor to 0
    this.m_motorVoltage = 0;
    this.m_motorSpeed = 0;
    this.m_elevatorSim.setInputVoltage(0);
  }

  // Getters for telemetry
  getPosition(): number {
    return this.m_encoderDistance;
  }

  getVelocity(): number {
    return this.m_elevatorSim.getVelocity();
  }

  getCurrentDraw(): number {
    return this.m_elevatorSim.getCurrentDraw();
  }

  getBatteryVoltage(): number {
    return this.m_batteryVoltage;
  }

  getElevatorLength(): number {
    return this.m_elevatorLength;
  }

  hasHitLowerLimit(): boolean {
    return this.m_elevatorSim.hasHitLowerLimit();
  }

  hasHitUpperLimit(): boolean {
    return this.m_elevatorSim.hasHitUpperLimit();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.m_elevatorSim.delete();
    this.m_elevatorGearbox.delete();
    (this.m_controller as any).delete();
    (this.m_feedforward as any).delete();
  }
}

