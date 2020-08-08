cmake_minimum_required(VERSION 3.10)
project(frag)

set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)

find_package(OpenGL REQUIRED)
find_package(glfw3 REQUIRED)

add_executable(frag src/main.c)
target_link_libraries(frag OpenGL::GL glfw)

# OpenGL is deprecated in macOS Mojave and later.
add_compile_definitions(GL_SILENCE_DEPRECATION)
