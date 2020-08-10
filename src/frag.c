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

    // Framebuffer and associated texture

    GLuint framebuffer;
    glGenFramebuffers(1, &framebuffer);
    if (framebuffer == 0) {
        fprintf(stderr, "error: failed to create framebuffer\n");
        return -1;
    }

    GLuint framebuffer_tex;
    glGenTextures(1, &framebuffer_tex);
    if (framebuffer_tex == 0) {
        fprintf(stderr, "error: failed to create texture\n");
        return -1;
    }

    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, framebuffer_tex);
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, settings->width, settings->height, 0, GL_RGBA, GL_UNSIGNED_BYTE, 0);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);

    glBindFramebuffer(GL_FRAMEBUFFER, framebuffer);
    glFramebufferTexture(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, framebuffer_tex, 0);

    static const GLuint user_shader_outputs[] = {
        GL_COLOR_ATTACHMENT0
    };
    glBindFramebuffer(GL_FRAMEBUFFER, framebuffer);
    glDrawBuffers(1, user_shader_outputs);

    if (glCheckFramebufferStatus(GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE) {
        fprintf(stderr, "error: failed to set up framebuffer\n");
        return -1;
    }

    // Shader

    static const char *vert_shader =
        "#version 330\n"
        "in vec3 vertex;\n"
        "void main() { gl_Position = vec4(vertex, 1); }\n";

    static const char *view_shader =
        "#version 330\n"
        "uniform sampler2D sampler;\n"
        "uniform vec2 resolution;\n"
        "out vec4 fragColor;\n"
        "void main() {\n"
        "    fragColor = texture(sampler, gl_FragCoord.xy / resolution);\n"
        "}\n";

    static const char *const vert_inputs[] = {
        "vertex", NULL
    };

    static const char *const frag_outputs[] = {
        "fragColor", NULL
    };

    GLuint user_program;
    if (create_program(&user_program, vert_shader, settings->source, vert_inputs, frag_outputs) == -1) {
        return -1;
    }

    GLuint view_program;
    if (create_program(&view_program, vert_shader, view_shader, vert_inputs, frag_outputs) == -1) {
        return -1;
    }

    // Uniforms

    glUseProgram(user_program);
    glUniform2f(
        glGetUniformLocation(user_program, "resolution"),
        (float) settings->width,
        (float) settings->height
    );

    glUseProgram(view_program);
    glUniform1i(
        glGetUniformLocation(view_program, "sampler"),
        0
    );
    glUniform2f(
        glGetUniformLocation(view_program, "resolution"),
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

            glActiveTexture(GL_TEXTURE0);
            glBindTexture(GL_TEXTURE_2D, framebuffer_tex);

            glViewport(0, 0, settings->width, settings->height);
            glBindFramebuffer(GL_FRAMEBUFFER, framebuffer);
            glUseProgram(user_program);
            glBindVertexArray(vao);
            glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);

            glViewport(0, 0, viewport_width, viewport_height);
            glBindFramebuffer(GL_FRAMEBUFFER, 0);
            glUseProgram(view_program);
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
