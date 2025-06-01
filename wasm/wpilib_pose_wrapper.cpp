
#include "units/angle.h"
#include "units/length.h"
#include "frc/geometry/Pose2d.h"
#include "frc/geometry/Rotation2d.h"
#include "frc/geometry/Translation2d.h"
#include "frc/kinematics/DifferentialDriveKinematics.h"
#include "frc/kinematics/DifferentialDriveOdometry.h"
#include "frc/trajectory/Trajectory.h"
#include "frc/trajectory/TrajectoryGenerator.h"
#include "frc/controller/RamseteController.h"

// Export functions to JavaScript
extern "C" {
// Example function
double add(double a, double b) {
  return a + b;
}

// Create a Rotation2d
frc::Rotation2d* createRotation2d(double radians) {
  return new frc::Rotation2d(units::radian_t(radians));
}

// Get angle from Rotation2d
double getRotation2dRadians(frc::Rotation2d* rotation) {
  return rotation->Radians().value();
}

// Delete a Rotation2d
void deleteRotation2d(frc::Rotation2d* rotation) {
  delete rotation;
}

// Add more functions for the classes you need to expose
}