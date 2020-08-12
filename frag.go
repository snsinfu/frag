package frag

import (
	"errors"

	"github.com/go-gl/gl/v3.3-core/gl"
	"github.com/go-gl/glfw/v3.3/glfw"
)

type Frag struct {
	Width    int
	Height   int
	Scale    float64
	FPS      float64
	WrapMode int32
	Filename string
	Source   string
}

const (
	WrapRepeat = gl.REPEAT
	WrapMirror = gl.MIRRORED_REPEAT
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

const viewSource = `
#version 330

uniform sampler2D sampler;
in vec2 texCoord;
out vec4 fragColor;

void main() {
	fragColor = texture(sampler, texCoord);
}
`

func (f *Frag) Run() error {
	if err := glfw.Init(); err != nil {
		return err
	}
	defer glfw.Terminate()

	glfw.WindowHint(glfw.Visible, glfw.False)
	glfw.WindowHint(glfw.Resizable, glfw.True)
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

	var framebuffer [2]uint32
	var framebufferTex [2]uint32

	gl.GenTextures(2, &framebufferTex[0])
	defer gl.DeleteTextures(2, &framebufferTex[0])

	gl.ActiveTexture(gl.TEXTURE0)

	for i := 0; i < 2; i++ {
		gl.BindTexture(gl.TEXTURE_2D, framebufferTex[i])
		gl.TexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, int32(f.Width), int32(f.Height), 0, gl.RGBA, gl.UNSIGNED_BYTE, nil)
		gl.TexParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
		gl.TexParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
		gl.TexParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, f.WrapMode)
		gl.TexParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, f.WrapMode)
	}

	gl.GenFramebuffers(2, &framebuffer[0])
	defer gl.DeleteFramebuffers(2, &framebuffer[0])

	for i := 0; i < 2; i++ {
		gl.BindFramebuffer(gl.FRAMEBUFFER, framebuffer[i])
		gl.FramebufferTexture(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, framebufferTex[i], 0)

		colors := []uint32{gl.COLOR_ATTACHMENT0}
		gl.DrawBuffers(int32(len(colors)), &colors[0])

		if gl.CheckFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE {
			return errors.New("failed to build a framebuffer")
		}
	}

	userProgram, err := newProgram(
		vertSource, f.Source, []string{"vertex"}, []string{"fragColor"},
	)
	if err != nil {
		return err
	}
	defer gl.DeleteProgram(userProgram)

	viewProgram, err := newProgram(
		vertSource, viewSource, []string{"vertex"}, []string{"fragColor"},
	)
	if err != nil {
		return err
	}
	defer gl.DeleteProgram(viewProgram)

	// Uniforms

	gl.UseProgram(viewProgram)
	gl.Uniform1i(
		gl.GetUniformLocation(userProgram, gl.Str("sampler\x00")),
		0,
	)

	// Main loop

	window.SetKeyCallback(func(w *glfw.Window, key glfw.Key, scancode int, action glfw.Action, mods glfw.ModifierKey) {
		if key == glfw.KeyEscape && action == glfw.Press {
			w.SetShouldClose(true)
		}
	})

	window.Show()

	prevTime := glfw.GetTime()
	frame := 0

	for !window.ShouldClose() {
		curTime := glfw.GetTime()
		delay := curTime - prevTime

		if delay*f.FPS >= 1 {
			prevTime = curTime
			viewportWidth, viewportHeight = window.GetFramebufferSize()

			gl.Viewport(0, 0, int32(f.Width), int32(f.Height))
			gl.UseProgram(userProgram)
			gl.BindTexture(gl.TEXTURE_2D, framebufferTex[frame%2])
			gl.BindFramebuffer(gl.FRAMEBUFFER, framebuffer[(frame+1)%2])
			gl.BindVertexArray(vao)
			gl.DrawArrays(gl.TRIANGLE_STRIP, 0, 4)

			gl.Viewport(0, 0, int32(viewportWidth), int32(viewportHeight))
			gl.UseProgram(viewProgram)
			gl.BindTexture(gl.TEXTURE_2D, framebufferTex[(frame+1)%2])
			gl.BindFramebuffer(gl.FRAMEBUFFER, 0)
			gl.BindVertexArray(vao)
			gl.DrawArrays(gl.TRIANGLE_STRIP, 0, 4)

			frame++
			window.SwapBuffers()
		}

		glfw.PollEvents()
	}

	return nil
}
