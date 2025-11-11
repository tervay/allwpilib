#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <vector>
#include <memory>

// Include wpimath headers
#include "frc/MathUtil.h"
#include "frc/geometry/Pose2d.h"
#include "frc/geometry/Rotation2d.h"
#include "frc/geometry/Translation2d.h"
#include "frc/geometry/Transform2d.h"
#include "frc/kinematics/ChassisSpeeds.h"
#include "frc/kinematics/DifferentialDriveKinematics.h"
#include "frc/kinematics/DifferentialDriveWheelSpeeds.h"
#include "frc/kinematics/DifferentialDriveOdometry.h"
#include "frc/trajectory/Trajectory.h"
#include "frc/trajectory/TrajectoryGenerator.h"
#include "frc/trajectory/constraint/DifferentialDriveVoltageConstraint.h"
#include "frc/controller/SimpleMotorFeedforward.h"
#include "frc/controller/RamseteController.h"
#include "frc/controller/PIDController.h"
#include "frc/filter/LinearFilter.h"
#include "frc/estimator/KalmanFilter.h"
#include "units/angle.h"
#include "units/length.h"
#include "units/velocity.h"
#include "units/acceleration.h"
#include "units/voltage.h"

using namespace emscripten;
using namespace frc;

// Helper functions for converting between JS and C++ types
namespace {
    // Convert JavaScript array to std::vector
    template<typename T>
    std::vector<T> jsArrayToVector(val jsArray) {
        std::vector<T> result;
        unsigned int length = jsArray["length"].as<unsigned int>();
        result.reserve(length);
        for (unsigned int i = 0; i < length; ++i) {
            result.push_back(jsArray[i].as<T>());
        }
        return result;
    }

    // Convert std::vector to JavaScript array
    template<typename T>
    val vectorToJsArray(const std::vector<T>& vec) {
        val result = val::array();
        for (size_t i = 0; i < vec.size(); ++i) {
            result.set(i, vec[i]);
        }
        return result;
    }
}

// MathUtil bindings
class MathUtilWasm {
public:
    static double inputModulus(double input, double minimumInput, double maximumInput) {
        return frc::InputModulus(input, minimumInput, maximumInput);
    }

    static double angleModulus(double angleDegree) {
        return frc::AngleModulus(units::degree_t(angleDegree)).to<double>();
    }
};

// Pose2d bindings
class Pose2dWasm {
public:
    double x, y, rotation;

    Pose2dWasm(double x, double y, double rotation) 
        : x(x), y(y), rotation(rotation) {}

    Pose2d toPose2d() const {
        return Pose2d(
            units::meter_t(x),
            units::meter_t(y),
            Rotation2d(units::degree_t(rotation))
        );
    }

    static Pose2dWasm fromPose2d(const Pose2d& pose) {
        return Pose2dWasm(
            pose.X().to<double>(),
            pose.Y().to<double>(),
            pose.Rotation().Degrees().to<double>()
        );
    }

    Pose2dWasm transformBy(const Pose2dWasm& other) const {
        // Create a Transform2d from the other pose (relative to origin)
        Transform2d transform(Pose2d(), other.toPose2d());
        return fromPose2d(toPose2d().TransformBy(transform));
    }

    double distanceTo(const Pose2dWasm& other) const {
        // Calculate distance using translation
        auto thisPose = toPose2d();
        auto otherPose = other.toPose2d();
        auto translation = otherPose.Translation() - thisPose.Translation();
        return translation.Norm().to<double>();
    }
};

// PIDController bindings
class PIDControllerWasm {
public:
    PIDControllerWasm(double kp, double ki, double kd) 
        : controller(kp, ki, kd) {}

    double calculate(double measurement, double setpoint) {
        return controller.Calculate(measurement, setpoint);
    }

    void reset() {
        controller.Reset();
    }

    void setPID(double kp, double ki, double kd) {
        controller.SetPID(kp, ki, kd);
    }

    double getPositionError() const {
        return controller.GetError();
    }

    double getVelocityError() const {
        return controller.GetErrorDerivative();
    }

    bool atSetpoint() const {
        return controller.AtSetpoint();
    }

private:
    PIDController controller;
};

// DifferentialDriveKinematics bindings
class DifferentialDriveKinematicsWasm {
public:
    DifferentialDriveKinematicsWasm(double trackWidth) 
        : kinematics(units::meter_t(trackWidth)) {}

    val toChassisSpeeds(double leftSpeed, double rightSpeed) {
        DifferentialDriveWheelSpeeds wheelSpeeds{
            units::meters_per_second_t(leftSpeed),
            units::meters_per_second_t(rightSpeed)
        };
        auto speeds = kinematics.ToChassisSpeeds(wheelSpeeds);
        val result = val::object();
        result.set("vx", speeds.vx.to<double>());
        result.set("vy", speeds.vy.to<double>());
        result.set("omega", speeds.omega.to<double>());
        return result;
    }

    val toWheelSpeeds(double vx, double vy, double omega) {
        ChassisSpeeds chassisSpeeds{
            units::meters_per_second_t(vx),
            units::meters_per_second_t(vy),
            units::radians_per_second_t(omega)
        };
        auto wheelSpeeds = kinematics.ToWheelSpeeds(chassisSpeeds);
        val result = val::object();
        result.set("left", wheelSpeeds.left.to<double>());
        result.set("right", wheelSpeeds.right.to<double>());
        return result;
    }

private:
    DifferentialDriveKinematics kinematics;
};

// LinearFilter bindings
class LinearFilterWasm {
public:
    static LinearFilterWasm* movingAverage(int taps) {
        auto filter = LinearFilter<double>::MovingAverage(taps);
        return new LinearFilterWasm(std::move(filter));
    }

    static LinearFilterWasm* singlePoleIIR(double timeConstant, double period) {
        auto filter = LinearFilter<double>::SinglePoleIIR(
            timeConstant,
            units::second_t(period)
        );
        return new LinearFilterWasm(std::move(filter));
    }

    double calculate(double input) {
        return filter.Calculate(input);
    }

    void reset() {
        filter.Reset();
    }

private:
    LinearFilterWasm(LinearFilter<double> f) : filter(std::move(f)) {}
    LinearFilter<double> filter;
};

// Trajectory bindings
class TrajectoryWasm {
public:
    TrajectoryWasm() : trajectory() {}
    
    TrajectoryWasm(const Trajectory& traj) : trajectory(traj) {}

    val getState(double time) const {
        auto state = trajectory.Sample(units::second_t(time));
        val result = val::object();
        result.set("time", state.t.to<double>());
        result.set("velocity", state.velocity.to<double>());
        result.set("acceleration", state.acceleration.to<double>());
        
        val pose = val::object();
        pose.set("x", state.pose.X().to<double>());
        pose.set("y", state.pose.Y().to<double>());
        pose.set("rotation", state.pose.Rotation().Degrees().to<double>());
        result.set("pose", pose);
        
        return result;
    }

    double getTotalTime() const {
        return trajectory.TotalTime().to<double>();
    }

    val getStates() const {
        val result = val::array();
        auto states = trajectory.States();
        for (size_t i = 0; i < states.size(); ++i) {
            result.set(i, getState(states[i].t.to<double>()));
        }
        return result;
    }

    const Trajectory& getTrajectory() const { return trajectory; }

private:
    Trajectory trajectory;
};

// TrajectoryGenerator bindings
class TrajectoryGeneratorWasm {
public:
    static TrajectoryWasm* generateTrajectory(
        val startPose,
        val interiorWaypoints,
        val endPose,
        val config
    ) {
        Pose2d start(
            units::meter_t(startPose["x"].as<double>()),
            units::meter_t(startPose["y"].as<double>()),
            Rotation2d(units::degree_t(startPose["rotation"].as<double>()))
        );

        std::vector<Translation2d> waypoints;
        unsigned int length = interiorWaypoints["length"].as<unsigned int>();
        for (unsigned int i = 0; i < length; ++i) {
            val waypoint = interiorWaypoints[i];
            waypoints.push_back(Translation2d(
                units::meter_t(waypoint["x"].as<double>()),
                units::meter_t(waypoint["y"].as<double>())
            ));
        }

        Pose2d end(
            units::meter_t(endPose["x"].as<double>()),
            units::meter_t(endPose["y"].as<double>()),
            Rotation2d(units::degree_t(endPose["rotation"].as<double>()))
        );

        TrajectoryConfig trajConfig(
            units::meters_per_second_t(config["maxVelocity"].as<double>()),
            units::meters_per_second_squared_t(config["maxAcceleration"].as<double>())
        );

        auto trajectory = TrajectoryGenerator::GenerateTrajectory(
            start, waypoints, end, trajConfig
        );

        return new TrajectoryWasm(trajectory);
    }
};

// Emscripten bindings
EMSCRIPTEN_BINDINGS(wpimath) {
    // MathUtil
    class_<MathUtilWasm>("MathUtil")
        .class_function("inputModulus", &MathUtilWasm::inputModulus)
        .class_function("angleModulus", &MathUtilWasm::angleModulus);

    // Pose2d
    class_<Pose2dWasm>("Pose2d")
        .constructor<double, double, double>()
        .property("x", &Pose2dWasm::x)
        .property("y", &Pose2dWasm::y)
        .property("rotation", &Pose2dWasm::rotation)
        .function("transformBy", &Pose2dWasm::transformBy)
        .function("distanceTo", &Pose2dWasm::distanceTo);

    // PIDController
    class_<PIDControllerWasm>("PIDController")
        .constructor<double, double, double>()
        .function("calculate", &PIDControllerWasm::calculate)
        .function("reset", &PIDControllerWasm::reset)
        .function("setPID", &PIDControllerWasm::setPID)
        .function("getPositionError", &PIDControllerWasm::getPositionError)
        .function("getVelocityError", &PIDControllerWasm::getVelocityError)
        .function("atSetpoint", &PIDControllerWasm::atSetpoint);

    // DifferentialDriveKinematics
    class_<DifferentialDriveKinematicsWasm>("DifferentialDriveKinematics")
        .constructor<double>()
        .function("toChassisSpeeds", &DifferentialDriveKinematicsWasm::toChassisSpeeds)
        .function("toWheelSpeeds", &DifferentialDriveKinematicsWasm::toWheelSpeeds);

    // LinearFilter
    class_<LinearFilterWasm>("LinearFilter")
        .class_function("movingAverage", &LinearFilterWasm::movingAverage, allow_raw_pointers())
        .class_function("singlePoleIIR", &LinearFilterWasm::singlePoleIIR, allow_raw_pointers())
        .function("calculate", &LinearFilterWasm::calculate)
        .function("reset", &LinearFilterWasm::reset);

    // Trajectory
    class_<TrajectoryWasm>("Trajectory")
        .constructor<>()
        .function("getState", &TrajectoryWasm::getState)
        .function("getTotalTime", &TrajectoryWasm::getTotalTime)
        .function("getStates", &TrajectoryWasm::getStates);

    // TrajectoryGenerator
    class_<TrajectoryGeneratorWasm>("TrajectoryGenerator")
        .class_function("generateTrajectory", &TrajectoryGeneratorWasm::generateTrajectory, allow_raw_pointers());
}

