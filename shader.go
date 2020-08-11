package frag

import (
	"errors"

	"github.com/go-gl/gl/v3.3-core/gl"
)

type shaderError struct {
	Message string
	Log     string
}

func (err *shaderError) Error() string {
	msg := err.Message
	if err.Log != "" {
		msg += "\n"
		msg += err.Log
	}
	return msg
}

func newProgram(vert, frag string, attribs, colors []string) (uint32, error) {
	program := gl.CreateProgram()
	if program == 0 {
		return 0, errors.New("failed to create shader program")
	}

	clear := func() {
		gl.DeleteProgram(program)
	}
	defer (func() { clear() })()

	for i, name := range attribs {
		gl.BindAttribLocation(program, uint32(i), gl.Str(name+"\x00"))
	}

	for i, name := range colors {
		gl.BindFragDataLocation(program, uint32(i), gl.Str(name+"\x00"))
	}

	vertShader, err := newShader(gl.VERTEX_SHADER, vert)
	if err != nil {
		return 0, err
	}
	defer gl.DeleteShader(vertShader)

	fragShader, err := newShader(gl.FRAGMENT_SHADER, frag)
	if err != nil {
		return 0, err
	}
	defer gl.DeleteShader(fragShader)

	gl.AttachShader(program, vertShader)
	gl.AttachShader(program, fragShader)
	gl.LinkProgram(program)

	var ok int32
	gl.GetProgramiv(program, gl.LINK_STATUS, &ok)
	if ok == gl.FALSE {
		err := &shaderError{Message: "failed to link program"}

		var logSize int32
		gl.GetProgramiv(program, gl.INFO_LOG_LENGTH, &logSize)
		if logSize > 0 {
			log := make([]byte, int(logSize))
			gl.GetProgramInfoLog(program, logSize, nil, &log[0])
			err.Log = string(log)
		}

		return 0, err
	}

	gl.DetachShader(program, vertShader)
	gl.DetachShader(program, fragShader)

	clear = func() {}

	return program, nil
}

func newShader(xtype uint32, source string) (uint32, error) {
	shader := gl.CreateShader(xtype)
	if shader == 0 {
		return 0, errors.New("failed to create shader")
	}

	clear := func() {
		gl.DeleteShader(shader)
	}
	defer (func() { clear() })()

	sources, free := gl.Strs(source + "\x00")
	defer free()

	gl.ShaderSource(shader, 1, sources, nil)
	gl.CompileShader(shader)

	var ok int32
	gl.GetShaderiv(shader, gl.COMPILE_STATUS, &ok)
	if ok == gl.FALSE {
		err := &shaderError{Message: "failed to compile shader"}

		var logSize int32
		gl.GetShaderiv(shader, gl.INFO_LOG_LENGTH, &logSize)
		if logSize > 0 {
			log := make([]byte, int(logSize))
			gl.GetShaderInfoLog(shader, logSize, nil, &log[0])
			err.Log = string(log)
		}

		return 0, err
	}

	clear = func() {}

	return shader, nil
}
