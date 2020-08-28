#version 330

#pragma frag:canvas 50 50
#pragma frag:scale 10

// Two-body simulation. This shader stores global simulation state to fixed
// edge pixels. This is horribly inefficient as the identical simulation step
// is repeatedly computed in every fragment, but anyway.

uniform sampler2D sampler;
uniform vec2 resolution;
uniform int frame;
in vec2 texCoord;
out vec4 fragColor;


void main() {
    const float K = 1.1;
    const float G = 0.2;
    const float m1 = 1;
    const float m2 = 1;
    const float dt = 0.03;
    const float radius = 2;

    // Get state variables from edge pixels
    vec4 frag1 = texture(sampler, (vec2(0, 0) + 0.5) / resolution);
    vec4 frag2 = texture(sampler, (vec2(1, 0) + 0.5) / resolution);

    vec2 p1 = -1 + 2 * frag1.xy;
    vec2 v1 = -1 + 2 * frag1.zw;
    vec2 p2 = -1 + 2 * frag2.xy;
    vec2 v2 = -1 + 2 * frag2.zw;

    // Initialization
    if (frame <= 1) {
        p1 = vec2(0, 0.2);
        v1 = vec2(0.3, 0);
        p2 = vec2(0, -0.3);
        v2 = vec2(-0.3, 0);
    }

    // Purely gravitational particles quickly go unstable due to numerical
    // errors. The harmonic well forces bounded motion, thus mitigates the
    // numerical instability.
    vec2 harmonic1 = -K * p1;
    vec2 harmonic2 = -K * p2;
    vec2 interaction = -(p1 - p2) * G * m1 * m2 / pow(length(p1 - p2), 3);

    // Implicit Euler update
    v1 += (harmonic1 + interaction) * dt / m1;
    v2 += (harmonic2 - interaction) * dt / m2;
    p1 += v1 * dt;
    p2 += v2 * dt;

    // Plot the particles
    vec2 here = texCoord - 0.5;

    fragColor.rgb = vec3(0, 0, 0);

    if (length((here - p1) * resolution) < radius) {
        fragColor.rgb = vec3(1, 1, 0);
    }

    if (length((here - p2) * resolution) < radius) {
        fragColor.rgb = vec3(0, 1, 1);
    }

    // Overlay the previous frame to show particle trajectory
    fragColor.rgb += texture(sampler, texCoord).rgb * 0.85;

    // Store state variables as edge pixels
    vec2 pixCoord = texCoord * resolution - 0.5;

    if (length(pixCoord - vec2(0, 0)) < 0.5) {
        fragColor.rg = 0.5 + 0.5 * p1;
        fragColor.ba = 0.5 + 0.5 * v1;
    }

    if (length(pixCoord - vec2(1, 0)) < 0.5) {
        fragColor.rg = 0.5 + 0.5 * p2;
        fragColor.ba = 0.5 + 0.5 * v2;
    }
}
