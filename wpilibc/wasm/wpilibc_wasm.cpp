#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <vector>
#include <memory>

// Include wpilibc headers
#include "frc/simulation/ElevatorSim.h"
#include "frc/system/plant/DCMotor.h"
#include "frc/RobotController.h"

// Include wpimath headers (for units)
#include "units/length.h"
#include "units/mass.h"
#include "units/velocity.h"
#include "units/voltage.h"
#include "units/time.h"
#include "units/current.h"

using namespace emscripten;
using namespace frc;
using namespace frc::sim;

// DCMotor bindings - factory methods
// We store DCMotor instances and pass them by reference
class DCMotorWasm {
public:
    DCMotorWasm(const DCMotor& motor) : motor(motor) {}
    
    const DCMotor& getMotor() const { return motor; }

    static DCMotorWasm* vex775Pro(int numMotors) {
        return new DCMotorWasm(DCMotor::Vex775Pro(numMotors));
    }

    static DCMotorWasm* cim(int numMotors) {
        return new DCMotorWasm(DCMotor::CIM(numMotors));
    }

    static DCMotorWasm* neo(int numMotors) {
        return new DCMotorWasm(DCMotor::NEO(numMotors));
    }

    static DCMotorWasm* miniCIM(int numMotors) {
        return new DCMotorWasm(DCMotor::MiniCIM(numMotors));
    }

    static DCMotorWasm* bag(int numMotors) {
        return new DCMotorWasm(DCMotor::Bag(numMotors));
    }

    static DCMotorWasm* falcon500(int numMotors) {
        return new DCMotorWasm(DCMotor::Falcon500(numMotors));
    }

private:
    DCMotor motor;
};

// ElevatorSim bindings
class ElevatorSimWasm {
public:
    // Constructor using the simpler form: DCMotor, gearing, mass, radius, etc.
    ElevatorSimWasm(
        DCMotorWasm* gearbox,
        double gearing,
        double carriageMassKg,
        double drumRadiusMeters,
        double minHeightMeters,
        double maxHeightMeters,
        bool simulateGravity,
        double startingHeightMeters
    ) : elevator(
            gearbox->getMotor(),
            gearing,
            units::kilogram_t(carriageMassKg),
            units::meter_t(drumRadiusMeters),
            units::meter_t(minHeightMeters),
            units::meter_t(maxHeightMeters),
            simulateGravity,
            units::meter_t(startingHeightMeters)
        ) {}

    void setInputVoltage(double voltageVolts) {
        elevator.SetInputVoltage(units::volt_t(voltageVolts));
    }

    void update(double dtSeconds) {
        elevator.Update(units::second_t(dtSeconds));
    }

    double getPosition() const {
        return elevator.GetPosition().to<double>();
    }

    double getVelocity() const {
        return elevator.GetVelocity().to<double>();
    }

    double getCurrentDraw() const {
        return elevator.GetCurrentDraw().to<double>();
    }

    void setState(double positionMeters, double velocityMetersPerSecond) {
        elevator.SetState(
            units::meter_t(positionMeters),
            units::meters_per_second_t(velocityMetersPerSecond)
        );
    }

    bool hasHitLowerLimit() const {
        return elevator.HasHitLowerLimit();
    }

    bool hasHitUpperLimit() const {
        return elevator.HasHitUpperLimit();
    }

    bool wouldHitLowerLimit(double elevatorHeightMeters) const {
        return elevator.WouldHitLowerLimit(units::meter_t(elevatorHeightMeters));
    }

    bool wouldHitUpperLimit(double elevatorHeightMeters) const {
        return elevator.WouldHitUpperLimit(units::meter_t(elevatorHeightMeters));
    }

private:
    ElevatorSim elevator;
};

// Emscripten bindings
EMSCRIPTEN_BINDINGS(wpilibc) {
    // DCMotor factory methods - return pointers that can be passed to ElevatorSim
    class_<DCMotorWasm>("DCMotor")
        .class_function("vex775Pro", &DCMotorWasm::vex775Pro, allow_raw_pointers())
        .class_function("cim", &DCMotorWasm::cim, allow_raw_pointers())
        .class_function("neo", &DCMotorWasm::neo, allow_raw_pointers())
        .class_function("miniCIM", &DCMotorWasm::miniCIM, allow_raw_pointers())
        .class_function("bag", &DCMotorWasm::bag, allow_raw_pointers())
        .class_function("falcon500", &DCMotorWasm::falcon500, allow_raw_pointers());

    // ElevatorSim
    class_<ElevatorSimWasm>("ElevatorSim")
        .constructor<DCMotorWasm*, double, double, double, double, double, bool, double>(allow_raw_pointers())
        .function("setInputVoltage", &ElevatorSimWasm::setInputVoltage)
        .function("update", &ElevatorSimWasm::update)
        .function("getPosition", &ElevatorSimWasm::getPosition)
        .function("getVelocity", &ElevatorSimWasm::getVelocity)
        .function("getCurrentDraw", &ElevatorSimWasm::getCurrentDraw)
        .function("setState", &ElevatorSimWasm::setState)
        .function("hasHitLowerLimit", &ElevatorSimWasm::hasHitLowerLimit)
        .function("hasHitUpperLimit", &ElevatorSimWasm::hasHitUpperLimit)
        .function("wouldHitLowerLimit", &ElevatorSimWasm::wouldHitLowerLimit)
        .function("wouldHitUpperLimit", &ElevatorSimWasm::wouldHitUpperLimit);
}

