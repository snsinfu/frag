#include <stdio.h>

#include <GLFW/glfw3.h>
#include <OpenGL/gl.h>


struct config {
    int viewport_width;
    int viewport_height;
    const char *window_title;
};

static int  start(const struct config *config);
static void handleKey(GLFWwindow *window, int key, int scancode, int action, int mods);
static void perror_glfw(const char *msg);

int
main(void)
{
    struct config config = {
        .viewport_width = 500,
        .viewport_height = 500,
        .window_title = "frag",
    };

    if (start(&config) == -1) {
        return 1;
    }
    return 0;
}

static int
start(const struct config* config)
{
    if (!glfwInit()) {
        return -1;
    }

    int retcode = -1;
    GLFWwindow *window = NULL;

    glfwWindowHint(GLFW_VISIBLE, GLFW_FALSE);
    glfwWindowHint(GLFW_RESIZABLE, GLFW_FALSE);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GLFW_TRUE);

    window = glfwCreateWindow(
        config->viewport_width, config->viewport_height, config->window_title, NULL, NULL
    );
    if (window == NULL) {
        perror_glfw("failed to create window");
        goto cleanup;
    }

    glfwSetKeyCallback(window, handleKey);
    glfwShowWindow(window);

    while (!glfwWindowShouldClose(window)) {
        glfwPollEvents();
    }

    retcode = 0;

cleanup:
    glfwDestroyWindow(window);
    glfwTerminate();

    return retcode;
}

static void
handleKey(GLFWwindow *window, int key, int scancode, int action, int mods)
{
    if (key == GLFW_KEY_ESCAPE && action == GLFW_PRESS) {
        glfwSetWindowShouldClose(window, GLFW_TRUE);
    }
}

static void perror_glfw(const char *msg)
{
    const char *descr;
    int err = glfwGetError(&descr);
    fprintf(stderr, "error: %s (x%x) %s\n", msg, err, descr);
}
