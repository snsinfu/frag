#version 330

#pragma frag:canvas 1280 800
#pragma frag:scale  1.0
#pragma frag:fps    60.0

in vec2 texCoord;
out vec4 fragColor;

void main() {
    fragColor.r = 0.5 + 0.5 * texCoord.s;
    fragColor.g = 1.0 - 0.5 * texCoord.t;
    fragColor.b = 0.5 + 0.5 * texCoord.t;
}
