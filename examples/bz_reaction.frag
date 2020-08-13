#version 330

#pragma frag:canvas 500 500
#pragma frag:wrap   repeat

uniform sampler2D sampler;
uniform vec2 resolution;
uniform vec2 mouse;
in vec2 texCoord;
out vec4 fragColor;

void main() {
    // Reaction parameters.
    const vec3 params = vec3(0.9, 0.8, 0.7);

    // Mouse drop.
    const float dropSize = 50;
    const vec3 dropAmount = vec3(0.4, 0.5, 0.6);

    // Simulate reaction.
    vec2 texel = 1 / resolution;
    vec3 mean = 1.0 / 9 * (
        texture(sampler, texCoord + texel * vec2(-1, -1)).rgb +
        texture(sampler, texCoord + texel * vec2(-1,  0)).rgb +
        texture(sampler, texCoord + texel * vec2(-1, +1)).rgb +
        texture(sampler, texCoord + texel * vec2( 0, -1)).rgb +
        texture(sampler, texCoord + texel * vec2( 0,  0)).rgb +
        texture(sampler, texCoord + texel * vec2( 0, +1)).rgb +
        texture(sampler, texCoord + texel * vec2(+1, -1)).rgb +
        texture(sampler, texCoord + texel * vec2(+1,  0)).rgb +
        texture(sampler, texCoord + texel * vec2(+1, +1)).rgb
    );

    fragColor.rgb = mean * (1 + cross(mean, params));

    // Mouse pointer generates reactants.
    float delta = length(gl_FragCoord.xy - mouse);
    float hit = step(0, dropSize - delta);
    fragColor.rgb += hit * dropAmount;
}
