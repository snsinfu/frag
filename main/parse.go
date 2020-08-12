package main

import (
	"errors"
	"strconv"
	"strings"

	"github.com/snsinfu/frag"
)

var (
	errCanvasFormat = errors.New("invalid canvas size format")
	errCanvasSize   = errors.New("invalid canvas size")
	errScale        = errors.New("invalid scale")
	errFPS          = errors.New("invalid FPS")
	errWrapMode     = errors.New("invalid wrap mode")
)

func parseCanvas(s string) (int, int, error) {
	sep := strings.IndexAny(s, " ,x")
	if sep == -1 {
		return 0, 0, errCanvasFormat
	}

	width, err := parseCanvasSize(s[:sep])
	if err != nil {
		return 0, 0, err
	}

	height, err := parseCanvasSize(s[sep+1:])
	if err != nil {
		return 0, 0, err
	}

	return width, height, nil
}

func parseCanvasSize(s string) (int, error) {
	size, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		return 0, err
	}

	if size <= 0 {
		return 0, errCanvasSize
	}

	return int(size), nil
}

func parseScale(s string) (float64, error) {
	scale, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0, err
	}

	if scale <= 0 {
		return 0, errScale
	}

	return scale, nil
}

func parseFPS(s string) (float64, error) {
	fps, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0, err
	}

	if fps <= 0 {
		return 0, errFPS
	}

	return fps, nil
}

func parseWrapMode(s string) (int32, error) {
	switch s {
	case "repeat":
		return frag.WrapRepeat, nil

	case "mirror":
		return frag.WrapMirror, nil
	}

	return 0, errWrapMode
}
