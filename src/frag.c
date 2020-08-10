#include <stdio.h>

#include <GLFW/glfw3.h>

#include "frag.h"
#include "shader.h"


enum {
    minimum_opengl_major = 3,
    minimum_opengl_minor = 3,
};

static void handle_keys(GLFWwindow *window, int key, int scancode, int action, int mods);


int
run(const struct settings *settings)
{
    // Create window.

    if (!glfwInit()) {
        fprintf(stderr, "error: failed to initialize GLFW\n");
        return -1;
    }

    glfwWindowHint(GLFW_VISIBLE, GLFW_FALSE);
    glfwWindowHint(GLFW_RESIZABLE, GLFW_FALSE);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, minimum_opengl_major);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, minimum_opengl_minor);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GLFW_TRUE);

    int window_width = (int) (settings->width * settings->scale);
    int window_height = (int) (settings->height * settings->scale);

    GLFWwindow *window = glfwCreateWindow(
        window_width, window_height, settings->title, NULL, NULL
    );
    if (window == NULL) {
        fprintf(stderr, "error: failed to create window\n");
        return -1;
    }

    glfwMakeContextCurrent(window);

    int viewport_width;
    int viewport_height;
    glfwGetFramebufferSize(window, &viewport_width, &viewport_height);

    // Create scene.

    printf("OpenGL: %s\n", glGetString(GL_VERSION));

    // Vertices

    static float quad_vertices[] = {
        -1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0
    };

    GLuint vbo;
    glGenBuffers(1, &vbo);
    if (vbo == 0) {
        fprintf(stderr, "error: failed to generate vbo");
        return -1;
    }

    glBindBuffer(GL_ARRAY_BUFFER, vbo);
    glBufferData(GL_ARRAY_BUFFER, sizeof quad_vertices, quad_vertices, GL_STATIC_DRAW);

    // Attributes

    GLuint vao;
    glGenVertexArrays(1, &vao);
    if (vao == 0) {
        fprintf(stderr, "error: failed to generate vao");
        return -1;
    }

    glBindVertexArray(vao);
    glBindBuffer(GL_ARRAY_BUFFER, vbo);
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 0, 0);
    glEnableVertexAttribArray(0);

    // Shader

    static const char *vert_shader =
        "#version 330\n"
        "in vec3 vertex;\n"
        "void main() { gl_Position = vec4(vertex, 1); }\n";

    static const char *const vert_inputs[] = {
        "vertex", NULL
    };

    static const char *const frag_outputs[] = {
        "fragColor", NULL
    };

    GLuint program;
    if (create_program(&program, vert_shader, settings->source, vert_inputs, frag_outputs) == -1) {
        return -1;
    }

    // Uniforms

    glUseProgram(program);
    glUniform2f(
        glGetUniformLocation(program, "resolution"),
        (float) viewport_width,
        (float) viewport_height
    );

    // Rendering loop.

    glClear(GL_COLOR_BUFFER_BIT);
    glfwSetKeyCallback(window, handle_keys);
    glfwShowWindow(window);

    double prev_time = glfwGetTime();

    while (!glfwWindowShouldClose(window)) {
        double cur_time = glfwGetTime();
        double delay = cur_time - prev_time;

        if (delay * settings->fps >= 1) {
            prev_time = cur_time;

            glViewport(0, 0, viewport_width, viewport_height);
            glUseProgram(program);
            glBindVertexArray(vao);
            glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);

            glfwSwapBuffers(window);
        }

        glfwPollEvents();
    }

    glfwDestroyWindow(window);
    glfwTerminate();

    return 0;
}

static void
handle_keys(GLFWwindow *window, int key, int scancode, int action, int mods)
{
    if (key == GLFW_KEY_ESCAPE && action == GLFW_PRESS) {
        glfwSetWindowShouldClose(window, GL_TRUE);
    }
}
