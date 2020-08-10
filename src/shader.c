#include "shader.h"

#include <stdio.h>
#include <stdlib.h>


static int create_shader(GLuint *shader, GLuint type, const char *source);


int
create_program(
    GLuint *program_ret,
    const char *vert,
    const char *frag,
    const char *const *inputs,
    const char *const *outputs
)
{
    GLuint program = 0;
    GLuint vert_sh = 0;
    GLuint frag_sh = 0;

    program = glCreateProgram();
    if (program == 0) {
        goto failed;
    }

    if (create_shader(&vert_sh, GL_VERTEX_SHADER, vert) == -1) {
        goto failed;
    }

    if (create_shader(&frag_sh, GL_FRAGMENT_SHADER, frag) == -1) {
        goto failed;
    }

    if (inputs != NULL) {
        for (GLuint loc = 0; inputs[loc] != NULL; loc++) {
            glBindAttribLocation(program, loc, inputs[loc]);
        }
    }

    if (outputs != NULL) {
        for (GLuint loc = 0; outputs[loc] != NULL; loc++) {
            glBindFragDataLocation(program, loc, outputs[loc]);
        }
    }

    glAttachShader(program, vert_sh);
    glAttachShader(program, frag_sh);
    glLinkProgram(program);

    GLint ok;
    glGetProgramiv(program, GL_LINK_STATUS, &ok);
    if (!ok) {
        fprintf(stderr, "error: failed to link shader program\n");

        GLint size;
        glGetProgramiv(program, GL_INFO_LOG_LENGTH, &size);
        if (size > 0) {
            char *buf = malloc((size_t) size);
            if (buf != NULL) {
                glGetProgramInfoLog(program, size, NULL, buf);
                fputs(buf, stderr);
                free(buf);
            }
        }

        goto failed;
    }

    glDetachShader(program, vert_sh);
    glDetachShader(program, frag_sh);
    glDeleteShader(vert_sh);
    glDeleteShader(frag_sh);

    *program_ret = program;
    return 0;

failed:
    glDeleteProgram(program);
    glDeleteShader(vert_sh);
    glDeleteShader(frag_sh);
    return -1;
}

static int
create_shader(GLuint *shader_ret, GLuint type, const char *source)
{
    GLuint shader = 0;

    shader = glCreateShader(type);
    if (shader == 0) {
        goto failed;
    }

    glShaderSource(shader, 1, &source, NULL);
    glCompileShader(shader);

    GLint ok;
    glGetShaderiv(shader, GL_COMPILE_STATUS, &ok);
    if (!ok) {
        fprintf(stderr, "error: failed to compile shader\n");

        GLint size;
        glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &size);
        if (size > 0) {
            char *buf = malloc((size_t) size);
            if (buf != NULL) {
                glGetShaderInfoLog(shader, size, NULL, buf);
                fputs(buf, stderr);
                free(buf);
            }
        }

        goto failed;
    }

    *shader_ret = shader;
    return 0;

failed:
    glDeleteShader(shader);
    return -1;
}
