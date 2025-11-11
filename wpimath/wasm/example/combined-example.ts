/**
 * Combined TypeScript example using both wpimath and wpilibc WebAssembly modules
 * This example demonstrates Pose2d from wpimath and ElevatorSim from wpilibc
 * 
 * Uses auto-generated TypeScript definitions from Emscripten
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Type definitions (these would be auto-generated, but we'll use any for now)
interface MainModule {
  Pose2d: new (x: number, y: number, rotation: number) => Pose2d;
  MathUtil: {
    angleModulus: (angle: number) => number;
    inputModulus: (input: number, min: number, max: number) => number;
  };
}

interface Pose2d {
  x: number;
  y: number;
  rotation: number;
  distanceTo: (other: Pose2d) => number;
  transformBy: (other: Pose2d) => Pose2d;
  delete: () => void;
}

interface WpilibcModule {
  DCMotor: {
    vex775Pro: (numMotors: number) => DCMotor;
    cim: (numMotors: number) => DCMotor;
    neo: (numMotors: number) => DCMotor;
    miniCIM: (numMotors: number) => DCMotor;
    bag: (numMotors: number) => DCMotor;
    falcon500: (numMotors: number) => DCMotor;
  };
  ElevatorSim: new (
    gearbox: DCMotor,
    gearing: number,
    carriageMassKg: number,
    drumRadiusMeters: number,
    minHeightMeters: number,
    maxHeightMeters: number,
    simulateGravity: boolean,
    startingHeightMeters: number
  ) => ElevatorSim;
}

interface DCMotor {
  delete: () => void;
}

interface ElevatorSim {
  setInputVoltage: (voltageVolts: number) => void;
  update: (dtSeconds: number) => void;
  getPosition: () => number;
  getVelocity: () => number;
  getCurrentDraw: () => number;
  setState: (positionMeters: number, velocityMetersPerSecond: number) => void;
  hasHitLowerLimit: () => boolean;
  hasHitUpperLimit: () => boolean;
  delete: () => void;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the wpimath WebAssembly module
async function loadWpimath(): Promise<MainModule> {
  const wasmPath = join(__dirname, '../../dist/wpimath_wasm.js');
  
  const module = await import(wasmPath);
  
  const wpimath = await module.default({
    locateFile: (path: string): string => {
      if (path.endsWith('.wasm')) {
        return join(__dirname, '../../dist/wpimath_wasm.wasm');
      }
      return path;
    }
  }) as MainModule;
  
  return wpimath;
}

// Load the wpilibc WebAssembly module
async function loadWpilibc(): Promise<WpilibcModule> {
  const wasmPath = join(__dirname, '../../../wpilibc/wasm/dist/wpilibc_wasm.js');
  
  const module = await import(wasmPath);
  
  const wpilibc = await module.default({
    locateFile: (path: string): string => {
      if (path.endsWith('.wasm')) {
        return join(__dirname, '../../../wpilibc/wasm/dist/wpilibc_wasm.wasm');
      }
      return path;
    }
  }) as WpilibcModule;
  
  return wpilibc;
}

async function main(): Promise<void> {
  console.log('Loading WebAssembly modules...\n');
  
  try {
    // Load both modules
    const wpimath = await loadWpimath();
    const wpilibc = await loadWpilibc();
    
    console.log('Modules loaded successfully!\n');
    
    // ===== Pose2d Example (from wpimath) =====
    console.log('=== Pose2d Example (wpimath) ===');
    const pose1 = new wpimath.Pose2d(0, 0, 0);
    const pose2 = new wpimath.Pose2d(5, 3, 45);
    
    console.log(`Pose 1: x=${pose1.x}m, y=${pose1.y}m, rotation=${pose1.rotation}°`);
    console.log(`Pose 2: x=${pose2.x}m, y=${pose2.y}m, rotation=${pose2.rotation}°`);
    
    const distance = pose1.distanceTo(pose2);
    console.log(`Distance from Pose 1 to Pose 2: ${distance.toFixed(3)}m\n`);
    
    // ===== ElevatorSim Example (from wpilibc) =====
    console.log('=== ElevatorSim Example (wpilibc) ===');
    
    // Create a DCMotor (4 Vex 775 Pro motors in a gearbox)
    const gearbox: DCMotor = wpilibc.DCMotor.vex775Pro(4);
    console.log('Created gearbox with 4 Vex 775 Pro motors');
    
    // Create an ElevatorSim
    // Parameters:
    // - gearbox: DCMotor instance
    // - gearing: 10:1 gear reduction
    // - carriageMass: 5 kg
    // - drumRadius: 0.05 m (5 cm)
    // - minHeight: 0 m
    // - maxHeight: 2 m
    // - simulateGravity: true
    // - startingHeight: 0 m
    const elevator = new wpilibc.ElevatorSim(
      gearbox,
      10.0,        // 10:1 gear reduction
      5.0,         // 5 kg carriage mass
      0.05,        // 5 cm drum radius
      0.0,         // min height: 0 m
      2.0,         // max height: 2 m
      true,        // simulate gravity
      0.0          // starting height: 0 m
    );
    
    console.log('Created ElevatorSim:');
    console.log('  - Gearbox: 4x Vex 775 Pro, 10:1 reduction');
    console.log('  - Carriage mass: 5 kg');
    console.log('  - Drum radius: 5 cm');
    console.log('  - Height range: 0-2 m');
    console.log('  - Gravity: enabled\n');
    
    // Simulate the elevator
    console.log('Simulating elevator movement...');
    const dt = 0.02; // 20ms timestep (50 Hz)
    let time = 0;
    const maxTime = 5.0; // Simulate for 5 seconds
    
    // Apply voltage to raise the elevator
    elevator.setInputVoltage(12.0); // 12V
    
    console.log('Time (s) | Position (m) | Velocity (m/s) | Current (A)');
    console.log('---------|--------------|----------------|-------------');
    
    while (time < maxTime) {
      elevator.update(dt);
      
      const position = elevator.getPosition();
      const velocity = elevator.getVelocity();
      const current = elevator.getCurrentDraw();
      
      // Print every 0.5 seconds
      if (Math.abs(time % 0.5) < dt / 2 || time < dt) {
        console.log(
          `${time.toFixed(2).padStart(7)} | ${position.toFixed(3).padStart(12)} | ${velocity.toFixed(3).padStart(14)} | ${current.toFixed(2).padStart(11)}`
        );
      }
      
      // Check if we hit the upper limit
      if (elevator.hasHitUpperLimit()) {
        console.log(`\nElevator hit upper limit at t=${time.toFixed(2)}s`);
        break;
      }
      
      time += dt;
    }
    
    // Stop the elevator
    console.log('\nStopping elevator...');
    elevator.setInputVoltage(0.0);
    
    // Let it settle for a bit
    for (let i = 0; i < 10; i++) {
      elevator.update(dt);
    }
    
    const finalPosition = elevator.getPosition();
    const finalVelocity = elevator.getVelocity();
    console.log(`Final position: ${finalPosition.toFixed(3)} m`);
    console.log(`Final velocity: ${finalVelocity.toFixed(3)} m/s`);
    
    // Try to lower it
    console.log('\nLowering elevator...');
    elevator.setInputVoltage(-6.0); // -6V to lower
    
    for (let i = 0; i < 50; i++) {
      elevator.update(dt);
      if (elevator.hasHitLowerLimit()) {
        console.log(`Elevator hit lower limit at t=${(time + i * dt).toFixed(2)}s`);
        break;
      }
    }
    
    const lowerPosition = elevator.getPosition();
    console.log(`Position after lowering: ${lowerPosition.toFixed(3)} m\n`);
    
    // Clean up
    pose1.delete();
    pose2.delete();
    gearbox.delete();
    elevator.delete();
    
    console.log('Example completed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the example
main();

