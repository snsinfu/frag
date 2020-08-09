#include "scene.h"

#include <OpenGL/gl3.h>


static const char *noop_vertex_source =
    "#core 330\n"
    "in vec3 vertex;\n"
    "void main() { gl_Position = vec4(vertex, 1); }\n";

static const float quad_vertices[] = {
    -1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0
};


int
scene_create(struct scene *scene, const struct settings *settings)
{
    // Shader program
    GLuint program = glCreateProgram();

    glBindFragDataLocation(program, 0, "fragColor");

    GLuint vert_shader = glCreateShader(GL_VERTEX_SHADER);
    glShaderSource(vert_shader, 1, &noop_vertex_source, NULL);
    glCompileShader(vert_shader);

    GLuint frag_shader = glCreateShader(GL_FRAGMENT_SHADER);
    glShaderSource(frag_shader, 1, &settings->source, NULL);
    glCompileShader(frag_shader);

    glAttachShader(program, vert_shader);
    glAttachShader(program, frag_shader);
    glLinkProgram(program);

    glDetachShader(program, vert_shader);
    glDetachShader(program, frag_shader);
    glDeleteShader(vert_shader);
    glDeleteShader(frag_shader);

    // VBO
    GLuint surface_vbo = 0;
    glGenBuffers(1, &surface_vbo);
    glBindBuffer(GL_ARRAY_BUFFER, surface_vbo);
    glBufferData(GL_ARRAY_BUFFER, sizeof quad_vertices, quad_vertices, GL_STATIC_DRAW);

    // Uniforms
    glUseProgram(program);

    GLuint uniform_resolution = glGetUniformLocation(program, "resolution");
    GLuint uniform_time = glGetUniformLocation(program, "time");

    glUniform2f(uniform_resolution, (float) settings->width, (float) settings->height);
    glUniform1f(uniform_time, 0);

    // Attributes
    GLuint vao = 0;
    glGenVertexArrays(1, &vao);

    glBindVertexArray(vao);
    glBindBuffer(GL_ARRAY_BUFFER, surface_vbo);
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 0, 0);
    glEnableVertexAttribArray(0);

    scene->program = program;
    scene->vao = vao;
    scene->uniform_time = uniform_time;

    return 0;
}

void
scene_render(struct scene *scene)
{
    glUseProgram(scene->program);
    glBindVertexArray(scene->vao);
    glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
}

void
scene_cleanup(struct scene *scene)
{
    glDeleteProgram(scene->program);
}
