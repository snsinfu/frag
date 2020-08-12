#version 330

#pragma frag:canvas 1280 800
#pragma frag:scale  1.0
#pragma frag:fps    60.0

uniform float time;

in vec2 texCoord;
out vec4 fragColor;

void main() {
    float x = 0.5 + 0.5 * sin(2.0 * texCoord.s + time);
    float y = 0.5 + 0.5 * sin(2.0 * texCoord.t + time);
    float z = 0.5 + 0.5 * cos(2.0 * texCoord.t + time);

    fragColor.r = 0.5 + 0.5 * x;
    fragColor.g = 0.5 + 0.5 * y;
    fragColor.b = 0.5 + 0.5 * z;
}
