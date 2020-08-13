package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"runtime"

	"github.com/docopt/docopt-go"
	"github.com/snsinfu/frag"
)

const usage = `
usage: frag [options] <source>

  <source>  Filename of fragment shader source

options:
  -c, --canvas <size>  Size of canvas in pixels (format: <width>x<height>)
  -x, --scale <scale>  Display scale of the canvas
  -f, --fps <fps>      Maximum number of frames per second
  -w, --wrap <mode>    Wrap mode (repeat or mirror)
  --noresize           Do not allow resizing window
  -h, --help           Print usage message and exit
`

var defaultFrag = frag.Frag{
	Width:    400,
	Height:   400,
	Scale:    1.0,
	FPS:      60.0,
	WrapMode: frag.WrapRepeat,
}

func init() {
	// OpenGL requires this.
	runtime.LockOSThread()
}

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}
}

func run() error {
	frag := defaultFrag

	opts, err := docopt.ParseDoc(usage)
	if err != nil {
		return err
	}

	// Load #pragma settings from source code.

	filename, err := opts.String("<source>")
	if err != nil {
		return err
	}

	source, err := ioutil.ReadFile(filename)
	if err != nil {
		return err
	}

	frag.Filename = filename
	frag.Source = string(source)

	if err := parsePragma(frag.Source, &frag); err != nil {
		return err
	}

	// Overwrite settings with command-line options.

	if canvasSpec, ok := opts["--canvas"].(string); ok {
		width, height, err := parseCanvas(canvasSpec)
		if err != nil {
			return err
		}

		frag.Width = width
		frag.Height = height
	}

	if scaleSpec, ok := opts["--scale"].(string); ok {
		scale, err := parseScale(scaleSpec)
		if err != nil {
			return err
		}

		frag.Scale = scale
	}

	if fpsSpec, ok := opts["--fps"].(string); ok {
		fps, err := parseFPS(fpsSpec)
		if err != nil {
			return err
		}

		frag.FPS = fps
	}

	if wrapSpec, ok := opts["--wrap"].(string); ok {
		wrapMode, err := parseWrapMode(wrapSpec)
		if err != nil {
			return err
		}

		frag.WrapMode = wrapMode
	}

	frag.NoResize, err = opts.Bool("--noresize")
	if err != nil {
		return err
	}

	return frag.Run()
}
