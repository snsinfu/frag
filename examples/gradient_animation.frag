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
