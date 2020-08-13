#version 330

#pragma frag:canvas 480 270
#pragma frag:scale  2
#pragma frag:wrap   repeat

uniform sampler2D sampler;
uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;
in vec2 texCoord;
out vec4 fragColor;

void main() {
    // The rule of the Game of Life.
    vec2 texel = 1 / resolution;
    float cell = texture(sampler, texCoord).a;
    float neighbors = round(
        texture(sampler, texCoord + texel * vec2(-1, -1)).a +
        texture(sampler, texCoord + texel * vec2(-1,  0)).a +
        texture(sampler, texCoord + texel * vec2(-1, +1)).a +
        texture(sampler, texCoord + texel * vec2( 0, -1)).a +
        texture(sampler, texCoord + texel * vec2( 0, +1)).a +
        texture(sampler, texCoord + texel * vec2(+1, -1)).a +
        texture(sampler, texCoord + texel * vec2(+1,  0)).a +
        texture(sampler, texCoord + texel * vec2(+1, +1)).a
    );

    float alive = step(2, neighbors) - step(4, neighbors);
    float birth = step(3, neighbors) - step(4, neighbors);
    float next = mix(birth, alive, cell);

    // Mouse pointer generates life.
    vec2 delta = abs(gl_FragCoord.xy - mouse);
    float hit = step(0, 1.5 - max(delta.x, delta.y));
    next = max(next, hit);

    // Clock line.
    float code = step(0, sin(6.28 * time + 1.57 * gl_FragCoord.x));
    float dy = gl_FragCoord.y - resolution.y / 2;
    float center = step(0, dy) - step(1, dy);
    float clock = center * code;
    next = max(next, clock);

    // Different pixels get different colors.
    vec3 color;
    color.r = 0.5 + 0.5 * texCoord.s;
    color.g = 1.0 - 0.5 * texCoord.t;
    color.b = 0.5 + 0.5 * texCoord.t;

    fragColor = vec4(next * color, next);
}
