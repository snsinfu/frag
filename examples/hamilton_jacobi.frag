#version 330

#pragma frag:canvas 500 500
#pragma frag:scale 1
#pragma frag:wrap clamp

uniform sampler2D sampler;
uniform vec2 resolution;
uniform vec2 mouse;
uniform int frame;

in vec2 texCoord;
out vec4 fragColor;


float hamiltonian(vec2 q, vec2 p, float t) {
    float K = 0.1 * dot(p, p);
    float V = 30 * dot(q, q);
    float H0 = -4 + 3 * sin(2 * t);
    return K + V + H0;
}

float encode(float x) {
    return 0.5 + 0.5 * x;
}

float decode(float x) {
    return -1 + 2 * x;
}

void main() {
    const float dt = 0.01;
    const float pScale = 0.5;

    vec2 texel = 1 / resolution;
    float s0 = decode(texture(sampler, texCoord).a);
    float s1 = decode(texture(sampler, texCoord + texel * vec2(-1, 0)).a);
    float s2 = decode(texture(sampler, texCoord + texel * vec2(+1, 0)).a);
    float s3 = decode(texture(sampler, texCoord + texel * vec2(0, -1)).a);
    float s4 = decode(texture(sampler, texCoord + texel * vec2(0, +1)).a);

    vec2 q = (-1 + 2 * texCoord) / 2;
    vec2 p = vec2(s2 - s1, s4 - s3) / (2 * dt);
    float t = dt * float(frame);

    // s is intended to be the principal function at q (= s0) but using s0
    // causes numerical instability. So let us use a smoothed value.
    float s = (s0 + s1 + s2 + s3 + s4) / 5;

    // Hamilton-Jacobi equation.
    s -= hamiltonian(q, p, t) * dt;

    // Color-code momentum vector.
    vec2 u = clamp(0.5 + 0.5 * pScale * p, 0, 1);
    fragColor.r = 0.5 + 0.5 * u.x;
    fragColor.g = 1.0 - 0.5 * u.y;
    fragColor.b = 0.5 + 0.5 * u.y;
    fragColor.a = encode(s);
}
