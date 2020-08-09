#include "frag.h"

#include <stdio.h>

#include <GLFW/glfw3.h>


enum {
    minimum_opengl_major = 3,
    minimum_opengl_minor = 3,
};


static void handle_keys(GLFWwindow *window, int key, int scancode, int action, int mods);


int
run(const struct settings *settings)
{
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

    int viewport_width = (int) (settings->width * settings->scale);
    int viewport_height = (int) (settings->height * settings->scale);

    GLFWwindow *window = glfwCreateWindow(
        viewport_width, viewport_height, settings->title, NULL, NULL
    );
    if (window == NULL) {
        fprintf(stderr, "error: failed to create window\n");
        return -1;
    }

    glfwMakeContextCurrent(window);

    printf("OpenGL: %s\n", glGetString(GL_VERSION));

    glClear(GL_COLOR_BUFFER_BIT);
    double prev_time = glfwGetTime();

    glfwSetKeyCallback(window, handle_keys);
    glfwShowWindow(window);

    while (!glfwWindowShouldClose(window)) {
        double cur_time = glfwGetTime();
        double delay = cur_time - prev_time;

        if (delay * settings->fps >= 1) {
            prev_time = cur_time;

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
