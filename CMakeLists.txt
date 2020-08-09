cmake_minimum_required(VERSION 3.8)
cmake_policy(VERSION 3.8...3.11)

project(frag)

set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)

find_package(OpenGL REQUIRED)
find_package(glfw3 REQUIRED)

add_executable(
    frag
    src/main.c
    src/frag.c
    src/frag.h
    src/scene.c
    src/scene.h
    src/source.c
    src/source.h
)
target_link_libraries(frag OpenGL::GL glfw)

# OpenGL is deprecated in macOS Mojave and later.
add_compile_definitions(GL_SILENCE_DEPRECATION)
