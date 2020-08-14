#version 330

#pragma frag:canvas 500 500
#pragma frag:wrap repeat

uniform sampler2D sampler;
uniform vec2 resolution;
uniform vec2 mouse;
in vec2 texCoord;
out vec4 fragColor;

void main() {
    const float dropSize = 20;
    const vec3 dropAmount = vec3(0.9, 0.8, 0.7);

    // Simulate reaction.
    vec2 texel = 1 / resolution;
    vec3 u0 = texture(sampler, texCoord).rgb;
    vec3 u1 = texture(sampler, texCoord + texel * vec2(-1, 0)).rgb;
    vec3 u2 = texture(sampler, texCoord + texel * vec2(+1, 0)).rgb;
    vec3 u3 = texture(sampler, texCoord + texel * vec2(0, -1)).rgb;
    vec3 u4 = texture(sampler, texCoord + texel * vec2(0, +1)).rgb;
    vec3 u5 = texture(sampler, texCoord + texel * vec2(-1, -1)).rgb;
    vec3 u6 = texture(sampler, texCoord + texel * vec2(+1, -1)).rgb;
    vec3 u7 = texture(sampler, texCoord + texel * vec2(-1, +1)).rgb;
    vec3 u8 = texture(sampler, texCoord + texel * vec2(+1, +1)).rgb;

    vec3 m = (u0 + u1 + u2 + u3 + u4 + u5 + u6 + u7 + u8) / 9;
    vec3 v = abs(u2 - u1) + abs(u4 - u3);

    fragColor.rgb = m * (1 + cross(m, smoothstep(0, 1, v)));

    // Mouse pointer
    float delta = length(gl_FragCoord.xy - mouse);
    float hit = step(0, dropSize - delta);
    fragColor.rgb += hit * dropAmount;
}
