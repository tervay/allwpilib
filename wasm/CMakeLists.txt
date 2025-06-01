cmake_minimum_required(VERSION 3.11)
project(wpilib_pose_emscripten)

# Find the installed WPILib packages
find_package(wpimath REQUIRED)
find_package(wpiutil REQUIRED)

# Set Emscripten-specific flags
set(CMAKE_EXECUTABLE_SUFFIX ".js")

# Add the wrapper library
add_executable(wpilib_pose_js wpilib_pose_wrapper.cpp)

# Link against WPILib libraries
target_link_libraries(wpilib_pose_js 
    wpimath
    wpiutil
)

# Configure Emscripten options
set_target_properties(wpilib_pose_js PROPERTIES
    LINK_FLAGS "-s WASM=1 -s MODULARIZE=1 -s EXPORT_NAME='WPILibPose' -s ALLOW_MEMORY_GROWTH=1 -s EXPORTED_RUNTIME_METHODS=['ccall','cwrap'] -s EXPORTED_FUNCTIONS=['_malloc','_free'] --bind -s FILESYSTEM=0 -Oz"
)