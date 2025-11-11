#!/usr/bin/env npx tsx
/**
 * Example demonstrating the TypeScript Elevator class
 * Similar to the C++ Elevator example
 * 
 * Run with: npx tsx elevator-example.ts
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { Elevator } from './Elevator';

// Import auto-generated TypeScript definitions
import type { MainModule as WpilibcModule } from '../../../wpilibc/wasm/typescript/wpilibc.emscripten';
import type { MainModule as WpimathModule } from '../typescript/wpimath.emscripten';

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

// Load wpilibc WebAssembly module
async function loadWpilibc(): Promise<WpilibcModule> {
  const wasmJs = join(__dirname, '../../../wpilibc/wasm/dist/wpilibc_wasm.js');
  const wasmWasm = join(__dirname, '../../../wpilibc/wasm/dist/wpilibc_wasm.wasm');
  
  if (!existsSync(wasmJs)) {
    throw new Error(`wpilibc_wasm.js not found at ${wasmJs}\nPlease build wpilibc first: cd wpilibc/wasm && ./build.sh`);
  }
  
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
    
    // Create elevator
    console.log('=== Creating Elevator ===');
    const elevator = new Elevator(wpilibc, wpimath);
    console.log('✓ Elevator created\n');
    
    // Simulate for a bit to see initial state
    console.log('=== Initial State ===');
    for (let i = 0; i < 5; i++) {
      elevator.simulationPeriodic();
    }
    elevator.updateTelemetry();
    console.log(`Position: ${elevator.getPosition().toFixed(3)} m`);
    console.log(`Velocity: ${elevator.getVelocity().toFixed(3)} m/s`);
    console.log(`Battery: ${elevator.getBatteryVoltage().toFixed(2)} V\n`);
    
    // Reach a goal
    console.log('=== Reaching Goal (0.75 m) ===');
    const goal = 0.75; // 75 cm
    console.log(`Target position: ${goal} m\n`);
    
    const dt = 0.020; // 20ms timestep
    let time = 0;
    const maxTime = 5.0; // 5 seconds max
    
    console.log('Time (s) | Position (m) | Velocity (m/s) | Current (A) | Battery (V)');
    console.log('---------|-------------|----------------|-------------|-------------');
    
    while (time < maxTime) {
      // Update control
      elevator.reachGoal(goal);
      
      // Update simulation
      elevator.simulationPeriodic();
      elevator.updateTelemetry();
      
      const position = elevator.getPosition();
      const velocity = elevator.getVelocity();
      const current = elevator.getCurrentDraw();
      const battery = elevator.getBatteryVoltage();
      
      // Print every 0.1 seconds
      if (Math.abs(time % 0.1) < dt / 2 || time < dt) {
        console.log(
          `${time.toFixed(2).padStart(7)} | ${position.toFixed(3).padStart(11)} | ${velocity.toFixed(3).padStart(14)} | ${current.toFixed(2).padStart(11)} | ${battery.toFixed(2).padStart(11)}`
        );
      }
      
      // Check if we're close to the goal
      if (Math.abs(position - goal) < 0.01) {
        console.log(`\n✓ Reached goal at t=${time.toFixed(2)}s`);
        break;
      }
      
      // Check limits
      if (elevator.hasHitUpperLimit()) {
        console.log(`\n✓ Hit upper limit at t=${time.toFixed(2)}s`);
        break;
      }
      
      if (elevator.hasHitLowerLimit()) {
        // console.log(`\n✓ Hit lower limit at t=${time.toFixed(2)}s`);
        // break;
      }
      
      time += dt;
    }
    
    // Stop
    console.log('\n=== Stopping Elevator ===');
    elevator.stop();
    
    // Let it settle
    for (let i = 0; i < 10; i++) {
      elevator.simulationPeriodic();
      elevator.updateTelemetry();
    }
    
    const finalPosition = elevator.getPosition();
    const finalVelocity = elevator.getVelocity();
    console.log(`Final position: ${finalPosition.toFixed(3)} m`);
    console.log(`Final velocity: ${finalVelocity.toFixed(3)} m/s`);
    console.log(`Elevator length: ${elevator.getElevatorLength().toFixed(3)} m\n`);
    
    // Clean up
    elevator.destroy();
    
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

