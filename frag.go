package frag

import (
	"errors"

	"github.com/go-gl/gl/v3.3-core/gl"
	"github.com/go-gl/glfw/v3.3/glfw"
)

type Wrap int

type Frag struct {
	Width    int
	Height   int
	Scale    float64
	FPS      float64
	WrapMode Wrap
	Filename string
	Source   string
}

const (
	WrapRepeat Wrap = iota
	WrapMirror
)

const (
	openGLMinor = 3
	openGLMajor = 3
)

const vertSource = `
#version 330

in vec2 vertex;
out vec2 texCoord;

void main() {
	texCoord = vertex;
	gl_Position = vec4(-1.0 + 2.0 * vertex, 0, 1);
}
`

func (f *Frag) Run() error {
	if err := glfw.Init(); err != nil {
		return err
	}
	defer glfw.Terminate()

	glfw.WindowHint(glfw.Visible, glfw.False)
	glfw.WindowHint(glfw.Resizable, glfw.False)
	glfw.WindowHint(glfw.ContextVersionMajor, openGLMinor)
	glfw.WindowHint(glfw.ContextVersionMinor, openGLMajor)
	glfw.WindowHint(glfw.OpenGLProfile, glfw.OpenGLCoreProfile)
	glfw.WindowHint(glfw.OpenGLForwardCompatible, glfw.True)

	windowWidth := int(float64(f.Width) * f.Scale)
	windowHeight := int(float64(f.Height) * f.Scale)

	window, err := glfw.CreateWindow(windowWidth, windowHeight, f.Filename, nil, nil)
	if err != nil {
		return err
	}

	window.MakeContextCurrent()
	viewportWidth, viewportHeight := window.GetFramebufferSize()

	// Set up demo scene
	if err := gl.Init(); err != nil {
		return err
	}

	quadCoords := []float32{
		0, 0, 1, 0, 0, 1, 1, 1,
	}

	var vbo uint32
	gl.GenBuffers(1, &vbo)
	if vbo == 0 {
		return errors.New("failed to create vertex buffer")
	}
	defer gl.DeleteBuffers(1, &vbo)

	gl.BindBuffer(gl.ARRAY_BUFFER, vbo)
	gl.BufferData(gl.ARRAY_BUFFER, 4*len(quadCoords), gl.Ptr(quadCoords), gl.STATIC_DRAW)

	var vao uint32
	gl.GenVertexArrays(1, &vao)
	if vao == 0 {
		return errors.New("failed to create vertex array")
	}
	defer gl.DeleteVertexArrays(1, &vao)

	gl.BindVertexArray(vao)
	gl.BindBuffer(gl.ARRAY_BUFFER, vbo)
	gl.VertexAttribPointer(0, 2, gl.FLOAT, false, 0, gl.PtrOffset(0))
	gl.EnableVertexAttribArray(0)

	program, err := newProgram(
		vertSource, f.Source, []string{"vertex"}, []string{"fragColor"},
	)
	if err != nil {
		return err
	}
	defer gl.DeleteProgram(program)

	// Main loop

	window.Show()

	prevTime := glfw.GetTime()

	for !window.ShouldClose() {
		curTime := glfw.GetTime()
		delay := curTime - prevTime

		if delay*f.FPS >= 1 {
			prevTime = curTime

			gl.Viewport(0, 0, int32(viewportWidth), int32(viewportHeight))
			gl.UseProgram(program)
			gl.BindVertexArray(vao)
			gl.DrawArrays(gl.TRIANGLE_STRIP, 0, 4)

			window.SwapBuffers()
		}

		glfw.PollEvents()
	}

	return nil
}
