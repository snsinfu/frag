#pragma once

#include <GLFW/glfw3.h>


/**
 * Creates a shader program with given vertex shader and fragment shader.
 *
 * @param   program     Pointer to a variable to return the created program.
 *                      Nothing is assigned if compilation or linking fails.
 * @param   vert        Source code of vertex shader.
 * @param   frag        Source code of fragment shader.
 * @param   inputs      Null-terminated array of attribute names where i-th
 *                      element specifies the attribute at location i.
 * @param   outputs     Null-terminated array of fragment data names where i-th
 *                      element specifies the fragment data at location i.
 *
 * @return  0 on success, or -1 on failure.
 */
int create_program(
    GLuint *program,
    const char *vert,
    const char *frag,
    const char *const *inputs,
    const char *const *outputs
);
