#pragma once

// We use GLFW header as a portable way to include OpenGL headers.
#include <GLFW/glfw3.h>

#include "frag.h"


struct scene {
    GLuint program;
    GLuint vao;
    GLuint uniform_time;
};

int scene_create(struct scene *scene, const struct settings *settings);
void scene_render(struct scene *scene);
void scene_cleanup(struct scene *scene);
