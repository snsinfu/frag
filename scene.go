package frag

import (
	"errors"

	"github.com/go-gl/gl/v3.3-core/gl"
)

// Vertex shader for rendering a 2D quad to the whole viewport.
const vertSource = `
#version 330

in vec2 vertex;
out vec2 texCoord;

void main() {
	texCoord = vertex;
	gl_Position = vec4(-1.0 + 2.0 * vertex, 0, 1);
}
`

// Fragment shader for displaying texture on a quad.
const viewSource = `
#version 330

uniform sampler2D sampler;
in vec2 texCoord;
out vec4 fragColor;

void main() {
	fragColor = texture(sampler, texCoord);
}
`

// A size contains the pixel dimension of a rectangular image.
type size struct {
	X int
	Y int
}

// A sceneConfig specifies a scene to be rendered.
type sceneConfig struct {
	CanvasSize   size
	ViewportSize size
	WrapMode     int32
	FragShader   string
}

// A scene encupsulates OpenGL rendering procedures of a shader runner.
type scene struct {
	vbo          uint32
	vao          uint32
	canvasFB     [2]uint32
	canvasTex    [2]uint32
	userProgram  uint32
	viewProgram  uint32
	frame        int
	canvasSize   size
	viewportSize size
}

// newScene allocates OpenGL resources and builds shader programs for a scene
// described by given config.
func newScene(c sceneConfig) (*scene, error) {
	s := &scene{
		canvasSize:   c.CanvasSize,
		viewportSize: c.ViewportSize,
	}

	// Cleanup on failure. OpenGL's deallocation functions are specified to do
	// nothing for zero-valued resource names. So, it's safe to unconditionally
	// free resources that may have not been created.
	clean := func() {
		s.Close()
	}
	defer (func() { clean() })()

	if err := s.initVertex(c); err != nil {
		return nil, err
	}

	if err := s.initFramebuffer(c); err != nil {
		return nil, err
	}

	if err := s.initProgram(c); err != nil {
		return nil, err
	}

	// Success. Do not clean.
	clean = func() {}

	return s, nil
}

// initVertex creates vertex buffer and associated vertex array for the scene.
func (s *scene) initVertex(c sceneConfig) error {
	// 2D vertices of a triangle strip forming a quad on the xy plane.
	quadCoords := []float32{0, 0, 1, 0, 0, 1, 1, 1}

	gl.GenBuffers(1, &s.vbo)
	if s.vbo == 0 {
		return errors.New("failed to create vertex buffer")
	}

	gl.BindBuffer(gl.ARRAY_BUFFER, s.vbo)
	gl.BufferData(gl.ARRAY_BUFFER, 4*len(quadCoords), gl.Ptr(quadCoords), gl.STATIC_DRAW)

	gl.GenVertexArrays(1, &s.vao)
	if s.vao == 0 {
		return errors.New("failed to create vertex array")
	}

	gl.BindVertexArray(s.vao)
	gl.BindBuffer(gl.ARRAY_BUFFER, s.vbo)
	gl.VertexAttribPointer(0, 2, gl.FLOAT, false, 0, gl.PtrOffset(0))
	gl.EnableVertexAttribArray(0)

	return nil
}

// initFramebuffer creates framebuffers and their backing textures to store
// rendered output from user shader.
func (s *scene) initFramebuffer(c sceneConfig) error {
	gl.ActiveTexture(gl.TEXTURE0)

	// Create multiple textures and buffers to store previous frame and current
	// frame. This allows user shader to sample pixels from previous frame and
	// render stateful animation (like Conway's game of life).
	gl.GenTextures(int32(len(s.canvasTex)), &s.canvasTex[0])
	gl.GenFramebuffers(int32(len(s.canvasFB)), &s.canvasFB[0])

	for i := 0; i < len(s.canvasTex); i++ {
		gl.BindTexture(gl.TEXTURE_2D, s.canvasTex[i])

		gl.TexImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			int32(c.CanvasSize.X),
			int32(c.CanvasSize.Y),
			0,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			nil,
		)

		gl.TexParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
		gl.TexParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
		gl.TexParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, c.WrapMode)
		gl.TexParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, c.WrapMode)
	}

	for i := 0; i < len(s.canvasFB); i++ {
		gl.BindFramebuffer(gl.FRAMEBUFFER, s.canvasFB[i])
		gl.FramebufferTexture(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, s.canvasTex[i], 0)

		colors := [1]uint32{gl.COLOR_ATTACHMENT0}
		gl.DrawBuffers(int32(len(colors)), &colors[0])

		if gl.CheckFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE {
			return errors.New("failed to build a framebuffer")
		}
	}

	return nil
}

// initProgram creates shader programs.
func (s *scene) initProgram(c sceneConfig) error {
	var err error
	attribs := []string{"vertex"}
	colors := []string{"fragColor"}

	s.userProgram, err = newProgram(vertSource, c.FragShader, attribs, colors)
	if err != nil {
		return err
	}

	s.viewProgram, err = newProgram(vertSource, viewSource, attribs, colors)
	if err != nil {
		return err
	}

	// Set uniforms that do not change.
	resolutionLoc := gl.GetUniformLocation(s.userProgram, gl.Str("resolution\x00"))
	samplerLocUser := gl.GetUniformLocation(s.userProgram, gl.Str("sampler\x00"))
	gl.UseProgram(s.userProgram)
	gl.Uniform2f(resolutionLoc, float32(c.CanvasSize.X), float32(c.CanvasSize.Y))
	gl.Uniform1i(samplerLocUser, 0)

	samplerLocView := gl.GetUniformLocation(s.viewProgram, gl.Str("sampler\x00"))
	gl.UseProgram(s.viewProgram)
	gl.Uniform1i(samplerLocView, 0)

	return nil
}

// SetViewport updates the size of the viewport that displays the scene.
func (s *scene) SetViewport(w, h int) {
	s.viewportSize.X = w
	s.viewportSize.Y = h
}

// SetMouse passes mouse position to the shader. The position must be in the
// canvas coordinate system.
func (s *scene) SetMouse(x, y float64) {
	mouseLoc := gl.GetUniformLocation(s.userProgram, gl.Str("mouse\x00"))
	gl.UseProgram(s.userProgram)
	gl.Uniform2f(mouseLoc, float32(x), float32(y))
}

// SetTime passes program running time to the shader.
func (s *scene) SetTime(t float64) {
	timeLoc := gl.GetUniformLocation(s.userProgram, gl.Str("time\x00"))
	gl.UseProgram(s.userProgram)
	gl.Uniform1f(timeLoc, float32(t))
}

// Render renders the scene to the current context.
func (s *scene) Render() {
	// The shader sees previous frame via prevTex texture and renders the
	// current frame to curTex texture through curFB framebuffer.
	prevTex := s.canvasTex[s.frame%2]
	curTex := s.canvasTex[(s.frame+1)%2]
	curFB := s.canvasFB[(s.frame+1)%2]

	// User shader sees the number of frames that have been rendered.
	frameLoc := gl.GetUniformLocation(s.userProgram, gl.Str("frame\x00"))
	gl.UseProgram(s.userProgram)
	gl.Uniform1i(frameLoc, int32(s.frame))

	gl.ActiveTexture(gl.TEXTURE0)

	// Let user shader render to framebuffer.
	gl.Viewport(0, 0, int32(s.canvasSize.X), int32(s.canvasSize.Y))
	gl.UseProgram(s.userProgram)
	gl.BindTexture(gl.TEXTURE_2D, prevTex)
	gl.BindFramebuffer(gl.FRAMEBUFFER, curFB)
	gl.BindVertexArray(s.vao)
	gl.DrawArrays(gl.TRIANGLE_STRIP, 0, 4)

	// Scale and render the result to viewport.
	gl.Viewport(0, 0, int32(s.viewportSize.X), int32(s.viewportSize.Y))
	gl.UseProgram(s.viewProgram)
	gl.BindTexture(gl.TEXTURE_2D, curTex)
	gl.BindFramebuffer(gl.FRAMEBUFFER, 0)
	gl.BindVertexArray(s.vao)
	gl.DrawArrays(gl.TRIANGLE_STRIP, 0, 4)

	s.frame++
}

// Close disposes resources allocated for the scene.
func (s *scene) Close() {
	gl.DeleteBuffers(1, &s.vbo)
	gl.DeleteVertexArrays(1, &s.vao)
	gl.DeleteFramebuffers(int32(len(s.canvasFB)), &s.canvasFB[0])
	gl.DeleteTextures(int32(len(s.canvasTex)), &s.canvasTex[0])
	gl.DeleteProgram(s.userProgram)
	gl.DeleteProgram(s.viewProgram)
}
