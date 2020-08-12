#version 330

#pragma frag:canvas 400 200
#pragma frag:scale  2
#pragma frag:wrap   repeat

uniform sampler2D sampler;
uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;
out vec4 fragColor;

void main() {
    // Game of life
    ivec2 xy = ivec2(gl_FragCoord.xy);
    float cell = texelFetch(sampler, xy, 0).a;
    float neighbors =
        texelFetch(sampler, xy + ivec2(-1, -1), 0).a +
        texelFetch(sampler, xy + ivec2(-1,  0), 0).a +
        texelFetch(sampler, xy + ivec2(-1, +1), 0).a +
        texelFetch(sampler, xy + ivec2( 0, -1), 0).a +
        texelFetch(sampler, xy + ivec2( 0, +1), 0).a +
        texelFetch(sampler, xy + ivec2(+1, -1), 0).a +
        texelFetch(sampler, xy + ivec2(+1,  0), 0).a +
        texelFetch(sampler, xy + ivec2(+1, +1), 0).a;

    neighbors += 0.1;

    float alive = step(2.0, neighbors) - step(4.0, neighbors);
    float birth = step(3.0, neighbors) - step(4.0, neighbors);
    float next = mix(birth, alive, cell);

    // Birth at mouse pointer
    vec2 delta = abs(gl_FragCoord.xy - mouse);
    float hit = step(0.0, 1.5 - max(delta.x, delta.y));
    next = max(next, hit);

    // Random-ish generation at the bottom
    float t = 2.0 * gl_FragCoord.x;
    float gen = step(0.0, sin(time + t * t));
    gen *= step(-1.0, -gl_FragCoord.y);
    next = max(next, gen);

    fragColor = vec4(next, next, next, next);
}
