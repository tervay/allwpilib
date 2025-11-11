#include <emscripten/bind.h>

// Include wpilibc headers
#include "frc/simulation/ElevatorSim.h"
#include "frc/simulation/RoboRioSim.h"
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

    bool hasHitLowerLimit() const {
        return elevator.HasHitLowerLimit();
    }

    bool hasHitUpperLimit() const {
        return elevator.HasHitUpperLimit();
    }

private:
    ElevatorSim elevator;
};

// RoboRioSim wrapper functions for WebAssembly
void RoboRioSim_SetVInVoltage(double voltageVolts) {
    RoboRioSim::SetVInVoltage(units::volt_t(voltageVolts));
}

// Emscripten bindings
EMSCRIPTEN_BINDINGS(wpilibc) {
    // DCMotor factory methods - return pointers that can be passed to ElevatorSim
    class_<DCMotorWasm>("DCMotor")
        .class_function("vex775Pro", &DCMotorWasm::vex775Pro, allow_raw_pointers());

    // ElevatorSim
    class_<ElevatorSimWasm>("ElevatorSim")
        .constructor<DCMotorWasm*, double, double, double, double, double, bool, double>(allow_raw_pointers())
        .function("setInputVoltage", &ElevatorSimWasm::setInputVoltage)
        .function("update", &ElevatorSimWasm::update)
        .function("getPosition", &ElevatorSimWasm::getPosition)
        .function("getVelocity", &ElevatorSimWasm::getVelocity)
        .function("getCurrentDraw", &ElevatorSimWasm::getCurrentDraw)
        .function("hasHitLowerLimit", &ElevatorSimWasm::hasHitLowerLimit)
        .function("hasHitUpperLimit", &ElevatorSimWasm::hasHitUpperLimit);

    // RoboRioSim static methods
    function("RoboRioSim_setVInVoltage", &RoboRioSim_SetVInVoltage);
}

