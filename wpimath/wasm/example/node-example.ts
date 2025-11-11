/**
 * Simple Node.js TypeScript example using wpimath WebAssembly module
 * This example demonstrates basic Pose2d operations
 * 
 * Uses auto-generated TypeScript definitions from Emscripten
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { MainModule, Pose2d } from '../typescript/wpimath.emscripten';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the WebAssembly module
async function loadWpimath(): Promise<MainModule> {
  const wasmPath = join(__dirname, '../dist/wpimath_wasm.js');
  
  // Dynamic import of the Emscripten module
  const module = await import(wasmPath);
  
  // Call the factory function to create the module instance
  // The MainModuleFactory is exported as default from the generated types
  const wpimath = await module.default({
    // Node.js specific: locateFile tells Emscripten where to find the .wasm file
    locateFile: (path: string): string => {
      if (path.endsWith('.wasm')) {
        return join(__dirname, '../dist/wpimath_wasm.wasm');
      }
      return path;
    }
  }) as MainModule;
  
  return wpimath;
}

async function main(): Promise<void> {
  console.log('Loading wpimath WebAssembly module...');
  
  try {
    const wpimath = await loadWpimath();
    
    console.log('Module loaded successfully!\n');
    
    // Create some Pose2d instances using the typed constructors
    console.log('Creating Pose2d instances...');
    const pose1 = new wpimath.Pose2d(0, 0, 0);  // Start at origin, facing forward
    const pose2 = new wpimath.Pose2d(5, 3, 45); // 5m forward, 3m right, 45 degrees
    
    console.log(`Pose 1: x=${pose1.x}m, y=${pose1.y}m, rotation=${pose1.rotation}°`);
    console.log(`Pose 2: x=${pose2.x}m, y=${pose2.y}m, rotation=${pose2.rotation}°\n`);
    
    // Calculate distance between poses (fully typed!)
    const distance = pose1.distanceTo(pose2);
    console.log(`Distance from Pose 1 to Pose 2: ${distance.toFixed(3)}m\n`);
    
    // Transform pose1 by pose2 (returns typed Pose2d)
    const transformed = pose1.transformBy(pose2);
    console.log(`Pose 1 transformed by Pose 2:`);
    console.log(`  x=${transformed.x.toFixed(3)}m, y=${transformed.y.toFixed(3)}m, rotation=${transformed.rotation.toFixed(3)}°\n`);
    
    // Create a pose at a specific location
    const pose3 = new wpimath.Pose2d(10, 5, 90);
    console.log(`Pose 3: x=${pose3.x}m, y=${pose3.y}m, rotation=${pose3.rotation}°`);
    
    const distance2 = pose2.distanceTo(pose3);
    console.log(`Distance from Pose 2 to Pose 3: ${distance2.toFixed(3)}m\n`);
    
    // Demonstrate MathUtil static methods (also fully typed!)
    console.log('Using MathUtil static methods:');
    const wrappedAngle = wpimath.MathUtil.angleModulus(370);
    console.log(`angleModulus(370°) = ${wrappedAngle.toFixed(3)}°`);
    
    const wrappedValue = wpimath.MathUtil.inputModulus(15, 0, 10);
    console.log(`inputModulus(15, 0, 10) = ${wrappedValue.toFixed(3)}\n`);
    
    // Demonstrate PIDController (fully typed!)
    console.log('Using PIDController:');
    const pid = new wpimath.PIDController(0.5, 0.1, 0.2);
    const output = pid.calculate(5.0, 10.0);
    console.log(`PID output: ${output.toFixed(3)}`);
    console.log(`At setpoint: ${pid.atSetpoint()}`);
    
    console.log('\nExample completed successfully!');
    
    // Clean up (important for memory management with ClassHandle)
    pose1.delete();
    pose2.delete();
    pose3.delete();
    transformed.delete();
    pid.delete();
    
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
