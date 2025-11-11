#!/usr/bin/env npx tsx
/**
 * Simple TypeScript example using Pose2d and ElevatorSim from WebAssembly
 * 
 * Run with: npx tsx example.ts
 * 
 * Make sure both wpimath_wasm and wpilibc_wasm are built first:
 *   - cd wpimath/wasm && ./build.sh
 *   - cd wpilibc/wasm && ./build.sh
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Import auto-generated TypeScript definitions
import type { MainModule as WpilibcModule, DCMotor, ElevatorSim } from '../../wpilibc/wasm/typescript/wpilibc.emscripten';
import type { WpimathModule } from '../typescript/wpimath';

// Get paths relative to this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load wpimath WebAssembly module
async function loadWpimath(): Promise<WpimathModule> {
  const wasmJs = join(__dirname, '../dist/wpimath_wasm.js');
  const wasmWasm = join(__dirname, '../dist/wpimath_wasm.wasm');
  
  if (!existsSync(wasmJs)) {
    throw new Error(`wpimath_wasm.js not found at ${wasmJs}\nPlease build wpimath first: cd wpimath/wasm && ./build.sh`);
  }
  
  const module = await import(wasmJs);
  const wpimath = await module.default({
    locateFile: (path: string): string => {
      if (path.endsWith('.wasm')) {
        return wasmWasm;
      }
      return path;
    }
  }) as WpimathModule;
  
  return wpimath;
}

// Load wpilibc WebAssembly module using auto-generated types
async function loadWpilibc(): Promise<WpilibcModule> {
  const wasmJs = join(__dirname, '../../../wpilibc/wasm/dist/wpilibc_wasm.js');
  const wasmWasm = join(__dirname, '../../../wpilibc/wasm/dist/wpilibc_wasm.wasm');
  
  if (!existsSync(wasmJs)) {
    throw new Error(`wpilibc_wasm.js not found at ${wasmJs}\nPlease build wpilibc first: cd wpilibc/wasm && ./build.sh`);
  }
  
  // Import the module factory function
  const moduleFactory = (await import(wasmJs)).default;
  const wpilibc = await moduleFactory({
    locateFile: (path: string): string => {
      if (path.endsWith('.wasm')) {
        return wasmWasm;
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
    
    console.log('✓ Modules loaded successfully!\n');
    
    // ===== Pose2d Example =====
    console.log('=== Pose2d Example ===');
    const pose1 = new wpimath.Pose2d(0, 0, 0);
    const pose2 = new wpimath.Pose2d(5, 3, 45);
    
    console.log(`Pose 1: x=${pose1.x}m, y=${pose1.y}m, rotation=${pose1.rotation}°`);
    console.log(`Pose 2: x=${pose2.x}m, y=${pose2.y}m, rotation=${pose2.rotation}°`);
    
    const distance = pose1.distanceTo(pose2);
    console.log(`Distance from Pose 1 to Pose 2: ${distance.toFixed(3)}m`);
    
    const transformed = pose1.transformBy(pose2);
    console.log(`Pose 1 transformed by Pose 2: x=${transformed.x.toFixed(3)}m, y=${transformed.y.toFixed(3)}m, rotation=${transformed.rotation.toFixed(3)}°\n`);
    
    // Clean up poses after use (Pose2d extends ClassHandle which has delete method)
    (pose1 as any).delete();
    (pose2 as any).delete();
    (transformed as any).delete();
    
    // ===== ElevatorSim Example =====
    console.log('=== ElevatorSim Example ===');
    
    // Create a DCMotor (4 Vex 775 Pro motors in a gearbox)
    const gearbox = wpilibc.DCMotor.vex775Pro(4);
    if (!gearbox) {
      throw new Error('Failed to create DCMotor');
    }
    console.log('Created gearbox with 4 Vex 775 Pro motors');
    
    // Create an ElevatorSim
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
    const maxTime = 3.0; // Simulate for 3 seconds
    
    // Apply voltage to raise the elevator
    elevator.setInputVoltage(12.0); // 12V
    
    console.log('Time (s) | Position (m) | Velocity (m/s) | Current (A)');
    console.log('---------|--------------|----------------|-------------');
    
    while (time < maxTime) {
      elevator.update(dt);
      
      const position = elevator.getPosition();
      const velocity = elevator.getVelocity();
      const current = elevator.getCurrentDraw();
      
      // Print every 0.2 seconds
      if (Math.abs(time % 0.2) < dt / 2 || time < dt) {
        console.log(
          `${time.toFixed(2).padStart(7)} | ${position.toFixed(3).padStart(12)} | ${velocity.toFixed(3).padStart(14)} | ${current.toFixed(2).padStart(11)}`
        );
      }
      
      // Check if we hit the upper limit
      if (elevator.hasHitUpperLimit()) {
        console.log(`\n✓ Elevator hit upper limit at t=${time.toFixed(2)}s`);
        break;
      }
      
      time += dt;
    }
    
    // Stop the elevator
    console.log('\nStopping elevator...');
    elevator.setInputVoltage(0.0);
    
    // Let it settle
    for (let i = 0; i < 10; i++) {
      elevator.update(dt);
    }
    
    const finalPosition = elevator.getPosition();
    const finalVelocity = elevator.getVelocity();
    console.log(`Final position: ${finalPosition.toFixed(3)} m`);
    console.log(`Final velocity: ${finalVelocity.toFixed(3)} m/s`);
    
    // Lower the elevator
    console.log('\nLowering elevator...');
    elevator.setInputVoltage(-6.0); // -6V to lower
    
    for (let i = 0; i < 50; i++) {
      elevator.update(dt);
      if (elevator.hasHitLowerLimit()) {
        console.log(`✓ Elevator hit lower limit`);
        break;
      }
    }
    
    const lowerPosition = elevator.getPosition();
    console.log(`Position after lowering: ${lowerPosition.toFixed(3)} m\n`);
    
    // Clean up
    gearbox.delete();
    elevator.delete();
    
    console.log('✓ Example completed successfully!');
    
  } catch (error) {
    console.error('✗ Error:', error);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the example
main();

