#version 330

// Time evolution of phase space of the simple harmonic oscillator.
// Hamiltonian H(q,p) and Lieuville equation of phase density u(t,q,p):
//
//   H = 1/2 p^2 + 1/2 q^2
//   ∂u/∂t + p ∂u/∂q - q ∂u/∂p = 0
//

#pragma frag:canvas 77 77
#pragma frag:scale 5
#pragma frag:wrap clamp

uniform sampler2D sampler;
uniform vec2 resolution;
uniform int frame;
in vec2 texCoord;
out vec4 fragColor;

void main() {
    // const float dt = 0.002;
    // const float initDensity = 1;
    // const float smoothingFactor = 0.01;
    // const int smoothingInterval = 5;
    const float dt = 0.002;
    const float initDensity = 0.8;
    const float smoothingFactor = -0.08;
    const int smoothingInterval = 1;

    vec2 texel = 1 / resolution;
    float u0 = texture(sampler, texCoord).a;
    float u1 = texture(sampler, texCoord + texel * vec2(-1, 0)).a;
    float u2 = texture(sampler, texCoord + texel * vec2(+1, 0)).a;
    float u3 = texture(sampler, texCoord + texel * vec2(0, -1)).a;
    float u4 = texture(sampler, texCoord + texel * vec2(0, +1)).a;

    float u5 = texture(sampler, texCoord + texel * vec2(-1, +1)).a;
    float u6 = texture(sampler, texCoord + texel * vec2(+1, -1)).a;
    float u7 = texture(sampler, texCoord + texel * vec2(+1, -1)).a;
    float u8 = texture(sampler, texCoord + texel * vec2(-1, +1)).a;

    float smoothing = 0;
    if (frame % smoothingInterval == 0) {
        smoothing = smoothingFactor;
    }

    // Lieuville equation
    float dx = texel.x;
    float dy = texel.y;
    float q = -0.5 + texCoord.x;
    float p = -0.5 + texCoord.y;
    float u = mix(u0, (u1 + u2 + u3 + u4 + u5 + u6 + u7 + u8) / 8, smoothing);
    u -= dt * p * (u2 - u1) / (2 * dx);
    u += dt * q * (u4 - u3) / (2 * dy);

    // Initialization
    if (frame <= 1) {
        vec2 delta1 = abs(vec2(q, p) - vec2(0.2, -0.2));
        vec2 delta2 = abs(vec2(q, p) - vec2(-0.2, 0.2));
        u = 0;
        u += 1 - step(0.05, max(delta1.x, delta1.y));
        u += 1 - step(0.05, max(delta2.x, delta2.y));
        u *= initDensity;
    }

    fragColor.rgb = vec3(u, u, u);
    fragColor.a = u;
}
