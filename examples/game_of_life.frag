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

    neighbors += 0.1;

    float alive = step(2.0, neighbors) - step(4.0, neighbors);
    float birth = step(3.0, neighbors) - step(4.0, neighbors);
    float next = mix(birth, alive, cell);

    // Birth at mouse pointer
    vec2 delta = abs(gl_FragCoord.xy - mouse);
    float hit = step(0.0, 1.5 - max(delta.x, delta.y));
    next = max(next, hit);

    // Random-ish generation on the bottom edge.
    float bias = mod(100 * pos.x * pos.x, 100);
    float gen = step(0.0, sin(time + bias));
    gen *= step(-1.0, -gl_FragCoord.y);
    next = max(next, gen);

    fragColor = vec4(next, next, next, next);
}
