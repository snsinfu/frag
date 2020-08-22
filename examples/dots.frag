#version 330

uniform sampler2D sampler;
uniform vec2 mouse;
uniform float time;

in vec2 texCoord;
out vec4 fragColor;

void main() {
    vec2 pos = 0.2 * (gl_FragCoord.xy - mouse);

    float angle = 0.5 * time;
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    pos = rot * pos;

    float x = pos.x;
    float y = pos.y;
    float s = sin(x * x  + y * y);
    float c = cos(x * y);
    float z = s - c;

    fragColor.r = 0.5 + 0.5 * s;
    fragColor.g = 0.5 + 0.5 * c;
    fragColor.b = 0.5 + 0.25 * z;

    // Smooth transition
    fragColor.rgb = mix(fragColor.rgb, texture(sampler, texCoord).rgb, 0.95);
}
