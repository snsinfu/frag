package main

import (
	"strings"

	"github.com/snsinfu/frag"
)

const pragmaPrefix = "#pragma frag:"

// parsePragma scans GLSL source code and extracts `Frag` settings from
// recognizable `#pragma` directives.
func parsePragma(source string, frag *frag.Frag) error {
	for _, line := range strings.Split(source, "\n") {
		pragma, ok := scanPrefix(line, pragmaPrefix)
		if !ok {
			continue
		}

		key, value := splitOnce(pragma)

		switch key {
		case "canvas":
			w, h, err := parseCanvas(value)
			if err != nil {
				return err
			}
			frag.Width = w
			frag.Height = h

		case "scale":
			scale, err := parseScale(value)
			if err != nil {
				return err
			}
			frag.Scale = scale

		case "fps":
			fps, err := parseFPS(value)
			if err != nil {
				return err
			}
			frag.FPS = fps

		case "wrap":
			mode, err := parseWrapMode(value)
			if err != nil {
				return err
			}
			frag.WrapMode = mode

		case "bits":
			pixType, err := parsePixType(value)
			if err != nil {
				return err
			}
			frag.PixType = pixType

		default:
		}
	}
	return nil
}

func scanPrefix(s, prefix string) (string, bool) {
	if strings.HasPrefix(s, prefix) {
		return s[len(prefix):], true
	}
	return s, false
}

func splitOnce(s string) (string, string) {
	const spaceChars = " \t"

	pos := strings.IndexAny(s, spaceChars)
	if pos > 0 {
		s1 := s[:pos]
		s2 := s[pos:]
		s2 = strings.TrimLeft(s2, spaceChars)
		return s1, s2
	}

	return "", s
}
