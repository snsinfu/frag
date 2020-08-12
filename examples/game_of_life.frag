#version 330

#pragma frag:canvas 480 270
#pragma frag:scale  2
#pragma frag:wrap   repeat

uniform sampler2D sampler;
uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;
out vec4 fragColor;

void main() {
    // The rule of the Game of Life.
    vec2 pos = gl_FragCoord.xy / resolution;
    vec2 texel = 1 / resolution;
    float cell = texture(sampler, pos).a;
    float neighbors =
        texture(sampler, pos + texel * vec2(-1, -1)).a +
        texture(sampler, pos + texel * vec2(-1,  0)).a +
        texture(sampler, pos + texel * vec2(-1, +1)).a +
        texture(sampler, pos + texel * vec2( 0, -1)).a +
        texture(sampler, pos + texel * vec2( 0, +1)).a +
        texture(sampler, pos + texel * vec2(+1, -1)).a +
        texture(sampler, pos + texel * vec2(+1,  0)).a +
        texture(sampler, pos + texel * vec2(+1, +1)).a;

    // This may be helpful to mitigate bad floating-point errors near the
    // edges of the step functions below.
    neighbors += 0.1;

    float alive = step(2, neighbors) - step(4, neighbors);
    float birth = step(3, neighbors) - step(4, neighbors);
    float next = mix(birth, alive, cell);

    // Mouse pointer
    vec2 delta = abs(gl_FragCoord.xy - mouse);
    float hit = step(0, 1.5 - max(delta.x, delta.y));
    next = max(next, hit);

    // Clock line.
    float code = step(0, sin(6.28 * time + 1.57 * gl_FragCoord.x));
    float dy = gl_FragCoord.y - resolution.y / 2;
    float center = step(0, dy) - step(1, dy);
    float clock = center * code;
    next = max(next, clock);

    fragColor = vec4(next, next, next, next);
}
