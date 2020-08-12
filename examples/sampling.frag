#version 330

#pragma frag:canvas 50 50
#pragma frag:scale  10.0
#pragma frag:fps    60.0
#pragma frag:wrap   mirror

uniform sampler2D sampler;
uniform float time;
in vec2 texCoord;
out vec4 fragColor;

void main() {
    ivec2 xy = ivec2(gl_FragCoord.xy);

    if (xy.y == 0) {
        float s = 0.9 * float(xy.x);
        fragColor.r = 0.5 + 0.5 * sin(s);
        fragColor.g = 1.0 - 0.5 * cos(s);
        fragColor.b = 0.5 + 0.5 * cos(s);
        return;
    }

    vec4 u = 0.333 * (
        texelFetch(sampler, xy + ivec2(0, -1), 0) +
        texelFetch(sampler, xy + ivec2(-1, -1), 0) +
        texelFetch(sampler, xy + ivec2(1, -1), 0)
    );
    float ratio = 1.0 - mod(0.4 * time, 0.2 * texCoord.t);

    fragColor = mix(fragColor, u, ratio);
}
