#include <emscripten/bind.h>

#include "frc/geometry/Pose2d.h"
#include "frc/StateSpaceUtil.h"
#include "frc/system/LinearSystem.h"

using namespace emscripten;

double my_wasm_add(double a, double b) {
  return a + b;
}

double pose_hypot(double a, double b) {
  frc::Pose2d pose(units::meter_t{a}, units::meter_t{b}, frc::Rotation2d());

  return pose.Translation().Norm().value();
}

template <int States, int Inputs, int Outputs>
class LinearSystemSim {
 public:
  /**
   * Creates a simulated generic linear system.
   *
   * @param system             The system to simulate.
   * @param measurementStdDevs The standard deviations of the measurements.
   */
  explicit LinearSystemSim(
      const frc::LinearSystem<States, Inputs, Outputs>& system,
      const std::array<double, Outputs>& measurementStdDevs = {})
      : m_plant(system), m_measurementStdDevs(measurementStdDevs) {
    m_x = frc::Vectord<States>::Zero();
    m_y = frc::Vectord<Outputs>::Zero();
    m_u = frc::Vectord<Inputs>::Zero();
  }

  // virtual ~LinearSystemSim() = default;

  /**
   * Updates the simulation.
   *
   * @param dt The time between updates.
   */
  void Update(units::second_t dt) {
    // Update x. By default, this is the linear system dynamics xₖ₊₁ = Axₖ +
    // Buₖ.
    m_x = UpdateX(m_x, m_u, dt);

    // yₖ = Cxₖ + Duₖ
    m_y = m_plant.CalculateY(m_x, m_u);

    // Add noise. If the user did not pass a noise vector to the
    // constructor, then this method will not do anything because
    // the standard deviations default to zero.
    m_y += frc::MakeWhiteNoiseVector<Outputs>(m_measurementStdDevs);
  }

  /**
   * Returns the current output of the plant.
   *
   * @return The current output of the plant.
   */
  const frc::Vectord<Outputs>& GetOutput() const { return m_y; }

  /**
   * Returns an element of the current output of the plant.
   *
   * @param row The row to return.
   * @return An element of the current output of the plant.
   */
  double GetOutput(int row) const { return m_y(row); }

  /**
   * Sets the system inputs (usually voltages).
   *
   * @param u The system inputs.
   */
  void SetInput(const frc::Vectord<Inputs>& u) { m_u = u; }

  /**
   * Sets the system inputs.
   *
   * @param row   The row in the input matrix to set.
   * @param value The value to set the row to.
   */
  void SetInput(int row, double value) { m_u(row, 0) = value; }

  /**
   * Returns the current input of the plant.
   *
   * @return The current input of the plant.
   */
  const frc::Vectord<Inputs>& GetInput() const { return m_u; }

  /**
   * Returns an element of the current input of the plant.
   *
   * @param row The row to return.
   * @return An element of the current input of the plant.
   */
  double GetInput(int row) const { return m_u(row); }

  /**
   * Sets the system state.
   *
   * @param state The new state.
   */
  void SetState(const frc::Vectord<States>& state) {
    m_x = state;

    // Update the output to reflect the new state.
    //
    //   yₖ = Cxₖ + Duₖ
    m_y = m_plant.CalculateY(m_x, m_u);
  }

 protected:
  /**
   * Updates the state estimate of the system.
   *
   * @param currentXhat The current state estimate.
   * @param u           The system inputs (usually voltage).
   * @param dt          The time difference between controller updates.
   */
  virtual frc::Vectord<States> UpdateX(const frc::Vectord<States>& currentXhat,
                                       const frc::Vectord<Inputs>& u,
                                       units::second_t dt) {
    return m_plant.CalculateX(currentXhat, u, dt);
  }

  /**
   * Clamp the input vector such that no element exceeds the given voltage. If
   * any does, the relative magnitudes of the input will be maintained.
   *
   * @param maxInput The maximum magnitude of the input vector after clamping.
   */
  void ClampInput(double maxInput) {
    m_u = frc::DesaturateInputVector<Inputs>(m_u, maxInput);
  }

  /// The plant that represents the linear system.
  frc::LinearSystem<States, Inputs, Outputs> m_plant;

  /// State vector.
  frc::Vectord<States> m_x;

  /// Input vector.
  frc::Vectord<Inputs> m_u;

  /// Output vector.
  frc::Vectord<Outputs> m_y;

  /// The standard deviations of measurements, used for adding noise to the
  /// measurements.
  std::array<double, Outputs> m_measurementStdDevs;
};

EMSCRIPTEN_BINDINGS(my_wasm_module) {
  emscripten::function("my_wasm_add", &my_wasm_add);
  emscripten::function("pose_hypot", &pose_hypot);

  // value_object<frc::Matrixd<2, 2>>("Matrix_2_2");
  // value_object<frc::Matrixd<2, 1>>("Matrix_2_1");
  // value_object<frc::Matrixd<1, 2>>("Matrix_1_2");
  // value_object<frc::Matrixd<1, 1>>("Matrix_1_1");

  // class_<frc::LinearSystem<2, 1, 1>>("LinearSystem_2_1_1")
  //     .constructor<const frc::Matrixd<2, 2>&, const frc::Matrixd<2, 1>&,
  //                  const frc::Matrixd<1, 2>&, const frc::Matrixd<1, 1>&>();

  // class_<frc::LinearSystem<2, 1, 1>>("LinearSystem_2_1_1").constructor<>();
  // class_<LinearSystemSim<2, 1, 1>>("LinearSystemSim_2_1_1")
  //     .constructor<const frc::LinearSystem<2, 1, 1>&,
  //                  const std::array<double, 1>&>();
  //     .function("Update", &LinearSystemSim<2, 1, 1>::Update)
  //     .function("GetOutput", select_overload<const frc::Vectord<1>&() const>(
  //                                &LinearSystemSim<2, 1, 1>::GetOutput))
  //     .function("GetOutputElement", select_overload<double(int) const>(
  //                                       &LinearSystemSim<2, 1,
  //                                       1>::GetOutput))
  //     .function("SetInput", select_overload<void(const frc::Vectord<1>&)>(
  //                               &LinearSystemSim<2, 1, 1>::SetInput))
  //     .function("SetInputElement", select_overload<void(int, double)>(
  //                                      &LinearSystemSim<2, 1, 1>::SetInput))
  //     .function("GetInput", select_overload<const frc::Vectord<1>&() const>(
  //                               &LinearSystemSim<2, 1, 1>::GetInput))
  //     .function("GetInputElement", select_overload<double(int) const>(
  //                                      &LinearSystemSim<2, 1, 1>::GetInput))
  //     .function("SetState", &LinearSystemSim<2, 1, 1>::SetState);
}
