package frag

import (
	"errors"

	"github.com/go-gl/gl/v3.3-core/gl"
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

type Size struct {
	X int
	Y int
}

type SceneConfig struct {
	CanvasSize   Size
	ViewportSize Size
	WrapMode     int32
	FragShader   string
	InitImage    []byte
}

type Scene struct {
	vbo          uint32
	vao          uint32
	canvasFB     [2]uint32
	canvasTex    [2]uint32
	userProgram  uint32
	viewProgram  uint32
	frame        int
	canvasSize   Size
	viewportSize Size
}

func NewScene(c SceneConfig) (*Scene, error) {
	s := &Scene{
		canvasSize:   c.CanvasSize,
		viewportSize: c.ViewportSize,
	}

	cleanup := func() {
		s.Close()
	}
	defer (func() { cleanup() })()

	if err := s.initVertex(c); err != nil {
		return nil, err
	}

	if err := s.initFramebuffer(c); err != nil {
		return nil, err
	}

	if err := s.initProgram(c); err != nil {
		return nil, err
	}

	cleanup = func() {}

	return s, nil
}

func (s *Scene) initVertex(c SceneConfig) error {
	quadCoords := []float32{
		0, 0, 1, 0, 0, 1, 1, 1,
	}

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

func (s *Scene) initFramebuffer(c SceneConfig) error {
	gl.ActiveTexture(gl.TEXTURE0)

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

func (s *Scene) initProgram(c SceneConfig) error {
	var err error

	s.userProgram, err = newProgram(
		vertSource, c.FragShader, []string{"vertex"}, []string{"fragColor"},
	)
	if err != nil {
		return err
	}

	s.viewProgram, err = newProgram(
		vertSource, viewSource, []string{"vertex"}, []string{"fragColor"},
	)
	if err != nil {
		return err
	}

	// Uniforms
	gl.UseProgram(s.userProgram)
	gl.Uniform2f(
		gl.GetUniformLocation(s.userProgram, gl.Str("resolution\x00")),
		float32(c.CanvasSize.X),
		float32(c.CanvasSize.Y),
	)
	gl.Uniform1i(
		gl.GetUniformLocation(s.userProgram, gl.Str("sampler\x00")),
		0,
	)

	gl.UseProgram(s.viewProgram)
	gl.Uniform1i(
		gl.GetUniformLocation(s.viewProgram, gl.Str("sampler\x00")),
		0,
	)

	return nil
}

func(s *Scene) SetViewport(w, h int) {
	s.viewportSize.X = w
	s.viewportSize.Y = h
}

func (s *Scene) SetMouse(x, y float64) {
	gl.UseProgram(s.userProgram)
	gl.Uniform2f(
		gl.GetUniformLocation(s.userProgram, gl.Str("mouse\x00")),
		float32(x),
		float32(y),
	)
}

func (s *Scene) SetTime(t float64) {
	gl.UseProgram(s.userProgram)
	gl.Uniform1f(
		gl.GetUniformLocation(s.userProgram, gl.Str("time\x00")),
		float32(t),
	)
}

func (s *Scene) Render() {
	// Run user's fragment shader
	gl.Viewport(0, 0, int32(s.canvasSize.X), int32(s.canvasSize.Y))
	gl.UseProgram(s.userProgram)
	gl.Uniform1i(
		gl.GetUniformLocation(s.userProgram, gl.Str("frame\x00")),
		int32(s.frame),
	)
	gl.BindTexture(gl.TEXTURE_2D, s.canvasTex[s.frame%2])
	gl.BindFramebuffer(gl.FRAMEBUFFER, s.canvasFB[(s.frame+1)%2])
	gl.BindVertexArray(s.vao)
	gl.DrawArrays(gl.TRIANGLE_STRIP, 0, 4)

	gl.Viewport(0, 0, int32(s.viewportSize.X), int32(s.viewportSize.Y))
	gl.UseProgram(s.viewProgram)
	gl.BindTexture(gl.TEXTURE_2D, s.canvasTex[(s.frame+1)%2])
	gl.BindFramebuffer(gl.FRAMEBUFFER, 0)
	gl.BindVertexArray(s.vao)
	gl.DrawArrays(gl.TRIANGLE_STRIP, 0, 4)

	s.frame++
}

func (s *Scene) Close() {
	gl.DeleteBuffers(1, &s.vbo)
	gl.DeleteVertexArrays(1, &s.vao)
	gl.DeleteFramebuffers(int32(len(s.canvasFB)), &s.canvasFB[0])
	gl.DeleteTextures(int32(len(s.canvasTex)), &s.canvasTex[0])
	gl.DeleteProgram(s.userProgram)
	gl.DeleteProgram(s.viewProgram)
}
