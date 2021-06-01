#version 330

#pragma frag:bits 64
#pragma frag:canvas 200 130
#pragma frag:scale 3
#pragma frag:wrap repeat
#pragma frag:fps 60

uniform vec2 resolution;
uniform sampler2D sampler;
uniform int frame;
in vec2 texCoord;
out vec4 fragColor;

uint posNoise(uvec2 pos, uint seed);
uint feistel(uint val, uvec4 key);
uint encode(uint x, uint k);

// Flory-Huggins chemical potential.
float potential(float phi) {
    const float chi = 2.0;

    float enthalpy = (1 - 2 * phi) * chi;
    float mixing = log(phi) - log(1 - phi);
    return enthalpy + mixing;
}

void main() {
    const uint seed = 1u;
    const float enhance = 3.0;
    const float dt = 0.01;
    const float correction = 0;

    vec2 texel = 1 / resolution;
    float u0 = texture(sampler, texCoord).a;
    float u1 = texture(sampler, texCoord + texel * vec2(+1,  0)).a;
    float u2 = texture(sampler, texCoord + texel * vec2( 0, +1)).a;
    float u3 = texture(sampler, texCoord + texel * vec2(-1,  0)).a;
    float u4 = texture(sampler, texCoord + texel * vec2( 0, -1)).a;

    // 'u' is the fraction, not concentration, of the "white" component. Given
    // u = c1/(c1+c2), we have du = u(1-u) dc1/c1, so u(1-u) may correct the
    // dynamics so that the fraction is bounded... I guess?
    float corrector = pow(u0 * (1 - u0), correction);

    // Cahn-Hillard equation.
    float ddxMu = potential(u1) - 2 * potential(u0) + potential(u3);
    float ddyMu = potential(u2) - 2 * potential(u0) + potential(u4);
    float u = u0 + dt * (ddxMu + ddyMu) * corrector;

    // Random initialization.
    if (frame <= 1) {
        uvec2 pos = uvec2(texCoord * resolution);
        uint noise = posNoise(pos, seed);
        u = 0.1 + 0.8 * float(step(32768u, noise));
    }

    u = clamp(u, 0.05, 0.95);

    fragColor.rgb = 0.5 + enhance * (vec3(u, u, u) - 0.5);
    fragColor.a = u;
}

// Generates random 16-bit unsigned integer for given pixel point.
uint posNoise(uvec2 pos, uint seed) {
    uint codeX = pos.x + uint(resolution.x) * pos.y;
    uint codeY = pos.y + uint(resolution.y) * pos.x;
    uint code = (codeX ^ codeY) & 0xFFFFu;

    uint s1 = (seed >> 8) & 0xFFu;
    uint s2 = seed & 0xFFu;
    uvec4 key = uvec4(uvec2(s1, s2) ^ pos, uvec2(s2, s1) ^ pos);

    return feistel(code, key);
}

// 16-bit Feistel cipher with length-4 key.
uint feistel(uint val, uvec4 key) {
    uint s = (val >> 8) & 0xFFu;
    uint t = val & 0xFFu;
    uint prevT;

    prevT = t;
    t = s ^ (encode(t, key.x) & 0xFFu);
    s = prevT;

    prevT = t;
    t = s ^ (encode(t, key.y) & 0xFFu);
    s = prevT;

    prevT = t;
    t = s ^ (encode(t, key.z) & 0xFFu);
    s = prevT;

    prevT = t;
    t = s ^ (encode(t, key.w) & 0xFFu);
    s = prevT;

    return (t << 8) | s;
}

// One-way function used in the Feistel cipher.
uint encode(uint x, uint k) {
    return (x * k) ^ k;
}
