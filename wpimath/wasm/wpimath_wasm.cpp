#include <emscripten/bind.h>

// Include wpimath headers
#include "frc/controller/ElevatorFeedforward.h"
#include "frc/controller/PIDController.h"
#include "units/velocity.h"
#include "units/acceleration.h"
#include "units/voltage.h"
#include "units/time.h"

using namespace emscripten;
using namespace frc;

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

private:
    PIDController controller;
};

// ElevatorFeedforward bindings
class ElevatorFeedforwardWasm {
public:
    // Constructor with kS, kG, kV, kA, dt (all in base units)
    ElevatorFeedforwardWasm(double kS, double kG, double kV, double kA, double dt)
        : feedforward(
            units::volt_t(kS),
            units::volt_t(kG),
            units::unit_t<frc::ElevatorFeedforward::kv_unit>(kV),
            units::unit_t<frc::ElevatorFeedforward::ka_unit>(kA),
            units::second_t(dt)
        ) {}
    
    // Constructor with kS, kG, kV, kA (dt defaults to 0.020)
    ElevatorFeedforwardWasm(double kS, double kG, double kV, double kA)
        : ElevatorFeedforwardWasm(kS, kG, kV, kA, 0.020) {}
    
    // Constructor with kS, kG, kV (kA defaults to 0, dt defaults to 0.020)
    ElevatorFeedforwardWasm(double kS, double kG, double kV)
        : ElevatorFeedforwardWasm(kS, kG, kV, 0.0, 0.020) {}

    // Calculate with single velocity (current velocity)
    double calculate(double currentVelocity) {
        return feedforward.Calculate(units::meters_per_second_t(currentVelocity)).to<double>();
    }

private:
    ElevatorFeedforward feedforward;
};

// Emscripten bindings
EMSCRIPTEN_BINDINGS(wpimath) {
    // PIDController
    class_<PIDControllerWasm>("PIDController")
        .constructor<double, double, double>()
        .function("calculate", &PIDControllerWasm::calculate)
        .function("reset", &PIDControllerWasm::reset);

    // ElevatorFeedforward
    class_<ElevatorFeedforwardWasm>("ElevatorFeedforward")
        .constructor<double, double, double, double, double>()
        .constructor<double, double, double, double>()
        .constructor<double, double, double>()
        .function("calculate", static_cast<double(ElevatorFeedforwardWasm::*)(double)>(&ElevatorFeedforwardWasm::calculate));
}

