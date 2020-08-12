package frag

import (
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
	NoResize bool
}

const (
	WrapRepeat = gl.REPEAT
	WrapMirror = gl.MIRRORED_REPEAT
)

const (
	openGLMinor = 3
	openGLMajor = 3
)

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

	if f.NoResize {
		glfw.WindowHint(glfw.Resizable, glfw.False)
	}

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

	scene, err := NewScene(SceneConfig{
		CanvasSize:   Size{f.Width, f.Height},
		ViewportSize: Size{viewportWidth, viewportHeight},
		WrapMode:     f.WrapMode,
		FragShader:   f.Source,
	})
	if err != nil {
		return err
	}
	defer scene.Close()

	// Main loop

	window.SetKeyCallback(func(w *glfw.Window, key glfw.Key, scancode int, action glfw.Action, mods glfw.ModifierKey) {
		if key == glfw.KeyEscape && action == glfw.Press {
			w.SetShouldClose(true)
		}
	})

	window.Show()

	prevTime := glfw.GetTime()

	for !window.ShouldClose() {
		curTime := glfw.GetTime()
		delay := curTime - prevTime

		if delay*f.FPS >= 1 {
			prevTime = curTime
			viewportWidth, viewportHeight = window.GetFramebufferSize()
			windowWidth, windowHeight := window.GetSize()

			// Need to flip y coordinates.
			mouseX, mouseY := window.GetCursorPos()
			mouseY = float64(windowHeight) - mouseY
			mouseX *= float64(f.Width) / float64(windowWidth)
			mouseY *= float64(f.Height) / float64(windowHeight)

			scene.SetViewport(viewportWidth, viewportHeight)
			scene.SetMouse(mouseX, mouseY)
			scene.SetTime(curTime)
			scene.Render()

			window.SwapBuffers()
		}

		glfw.PollEvents()
	}

	return nil
}
