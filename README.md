# frag: GLSL fragment shader runner

[![Build Status][build-badge]][build-url]
[![Boost License][license-badge]][license-url]

`frag` is a GUI program that runs GLSL fragment shader on a 2D canvas. The
shader has access to mouse position, time and previous frame as a texture. So
you can render stateful animation like Conway's Game of Life!

[![Game of Life][game-of-life-screenshot]][game-of-life-code]

[build-badge]: https://github.com/snsinfu/frag/workflows/build/badge.svg
[build-url]: https://github.com/snsinfu/frag/actions?query=workflow%3Abuild
[license-badge]: https://img.shields.io/badge/license-MIT-blue.svg
[license-url]: ./LICENSE.txt
[game-of-life-screenshot]: ./examples/screenshots/game_of_life.png
[game-of-life-code]: ./examples/game_of_life.frag

- [Build](#build)
- [Usage](#usage)
- [License](#license)

See [examples directory](./examples) for example shaders!


## Build

`frag` is written in Go. Use the following commands to build an executable:

```console
$ git clone https://github.com/snsinfu/frag.git
$ cd frag
$ go build -o frag ./main
```

On linux you need Xorg header files. Install `xorg-dev` if you use Ubuntu or
Debian.


## Usage

`frag` accepts filename of a fragment shader source as an argument. Try running
an example:

```console
$ frag examples/gradient_animation.frag
```

The source is the standard GLSL shader with optional pragma directives:

```glsl
#version 330

#pragma frag:canvas 1280 800
#pragma frag:scale  1.0
#pragma frag:fps    60.0

uniform float time;

in vec2 texCoord;
out vec4 fragColor;

void main() {
    fragColor.r = 0.75 + 0.25 * sin(2.0 * texCoord.s + time);
    fragColor.g = 0.75 + 0.25 * sin(2.0 * texCoord.t + time);
    fragColor.b = 0.75 + 0.25 * cos(2.0 * texCoord.t + time);
}
```

Accepted pragmas:

| pragma                       | description                                |
|:-----------------------------|:-------------------------------------------|
| frag:canvas _width_ _height_ | Size of canvas in pixels.                  |
| frag:scale  _scale_          | Canvas is scaled on screen by this factor. |
| frag:fps    _fps_            | Maximum frames per second.                 |
| frag:wrap   _mode_           | Wrapping mode when sampling from canvas. `repeat`, `mirror` or `clamp`. |

The canvas size etc. can also be set via command-line options:

```console
$ frag --canvas 15x15 --scale 40 --fps 5 examples/gradient_animation.frag
```

See `frag --help` for the list of options.


## License

MIT License.
