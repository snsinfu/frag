#version 330

#pragma frag:canvas 720 480
#pragma frag:wrap repeat

uniform sampler2D sampler;
uniform vec2 resolution;
uniform int frame;

in vec2 texCoord;
out vec4 fragColor;

//
// Reaction network of reactants distributed on a grid.
//
//               +--------------+
//               | (-)          |
//               V              |
//     u(x,y) -----> u(x-1,y)   |
//                      |       |
//                      | (+)   |
//                      V       |
//           u(x+1,y) -----> u(x,y+1)
//
// Here (+) and (-) denote positive and negative catalytic activities. The
// reactants are laid out on the grid like this:
//
//     +----------+----------+----------+
//     | u(x-1,y) | u(x,y)   | u(x+1,y) |
//     +----------+----------+----------+
//                | u(x,y+1) |
//                +----------+
//
// The rate equations:
//
//     du(x,y)/dt   = -k1 f(u(x,y+1)) u(x,y)   + k2 u(x-1,y)
//     du(x-1,y)/dt =  k1 f(u(x,y+1)) u(x,y)   - k2 u(x-1,y)
//     du(x+1,y)/dt = -k3 g(u(x-1,y)) u(x+1,y) + k4 u(x,y+1)
//     du(x,y+1)/dt =  k3 g(u(x-1,y)) u(x+1,y) - k4 u(x,y+1)
//
// Here, f is a nonlinear gate function and g is a nagated one: g = 1 - f.
// Rewriting the positions, we get following equations:
//
//     du(x,y)/dt = -k1 f(u(x,y+1))   u(x,y)     + k2 u(x-1,y)
//     du(x,y)/dt =  k1 f(u(x+1,y+1)) u(x+1,y)   - k2 u(x,y)
//     du(x,y)/dt = -k3 g(u(x-2,y))   u(x,y)     + k4 u(x-1,y+1)
//     du(x,y)/dt =  k3 g(u(x-1,y-1)) u(x+1,y-1) - k4 u(x,y)
//
// Or, we should have written like this:
//
//     du(x,y)/dt =
//         - k1 f(u(x,y+1))   u(x,y)     + k2 u(x-1,y)
//         + k1 f(u(x+1,y+1)) u(x+1,y)   - k2 u(x,y)
//         - k3 g(u(x-2,y))   u(x,y)     + k4 u(x-1,y+1)
//         + k3 g(u(x-1,y-1)) u(x+1,y-1) - k4 u(x,y)
//
// We simulate the time evolution of the field u(x,y).
//

// Negated gate function. The function is 1 at x=0 and approaches to zero as
// x >> s.
float down(float x, float s) {
    float u1 = x / s;
    float u4 = u1 * u1 * u1 * u1;
    return 1 / (1 + u4);
}

// Gate function. The function is 0 at x=0 and approaches to one as x >> s.
float up(float x, float s) {
    return 1 - down(x, s);
}

// Returns spatially random-looking value for given position.
float posNoise(ivec2 pos) {
    int hash = ((pos.x * 137) ^ (pos.y * 119)) % 177;
    float noise = float(hash) / 176;
    return noise * noise;
}

void main() {
    const float dt = 0.05;
    const float k1 = 5;
    const float k2 = 1;
    const float k3 = 5;
    const float k4 = 1.4;
    const float s1 = 0.40;
    const float s2 = 0.19;

    vec2 texel = 1 / resolution;
    float u0 = texture(sampler, texCoord).a;
    float u1 = texture(sampler, texCoord + texel * vec2( 0, +1)).a;
    float u2 = texture(sampler, texCoord + texel * vec2(-1,  0)).a;
    float u3 = texture(sampler, texCoord + texel * vec2(+1, +1)).a;
    float u4 = texture(sampler, texCoord + texel * vec2(+1,  0)).a;
    float u5 = texture(sampler, texCoord + texel * vec2(-2,  0)).a;
    float u6 = texture(sampler, texCoord + texel * vec2(-1, +1)).a;
    float u7 = texture(sampler, texCoord + texel * vec2(-1, -1)).a;
    float u8 = texture(sampler, texCoord + texel * vec2(+1, -1)).a;

    float v = 0;
    v += -k1 * down(u1, s1) * u0 + k2 * u2;
    v += +k1 * down(u3, s1) * u4 - k2 * u0;
    v += -k3 * up(u5, s2) * u0 + k4 * u6;
    v += +k3 * up(u7, s2) * u8 - k4 * u0;

    float u = u0 + v * dt;

    // Use random-ish initial state.
    float init = posNoise(ivec2(gl_FragCoord.xy));
    float isFirst = step(0, 0.5 - float(frame));
    u = mix(u, init, isFirst);

    vec3 colorMap = vec3(
        0.5 + 0.5 * texCoord.s,
        1.0 - 0.5 * texCoord.t,
        0.5 + 0.5 * texCoord.t
    );
    fragColor.rgb = u * colorMap;
    fragColor.a = u;
}
