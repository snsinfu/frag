cmake_minimum_required(VERSION 3.3)
project(frag)

set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)

find_package(OpenGL REQUIRED)
find_package(glfw3 REQUIRED)

include_directories(${OPENGL_INCLUDE_DIR})
add_executable(frag src/main.c)

target_link_libraries(frag ${OPENGL_gl_LIBRARY} glfw)
