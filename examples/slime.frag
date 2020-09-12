#version 330

#pragma frag:canvas 250 250
#pragma frag:scale 2
#pragma frag:fps 5

uniform vec2 resolution;
uniform sampler2D sampler;
uniform int frame;
in vec2 texCoord;
out vec4 fragColor;

uint posNoise(uvec2 pos, uint seed);
uint feistel(uint val, uvec4 key);
uint encode(uint x, uint k);

void main() {
    const uint seed = 23456u;

    // Load pixels ---------------------------------------------------------

    vec2 texel = 1 / resolution;
    float u0 = texture(sampler, texCoord).a;
    float u1 = texture(sampler, texCoord + texel * vec2(+1,  0)).a;
    float u2 = texture(sampler, texCoord + texel * vec2( 0, +1)).a;
    float u3 = texture(sampler, texCoord + texel * vec2(-1,  0)).a;
    float u4 = texture(sampler, texCoord + texel * vec2( 0, -1)).a;
    float u5 = texture(sampler, texCoord + texel * vec2(+1, +1)).a;
    float u6 = texture(sampler, texCoord + texel * vec2(-1, +1)).a;
    float u7 = texture(sampler, texCoord + texel * vec2(-1, -1)).a;
    float u8 = texture(sampler, texCoord + texel * vec2(+1, -1)).a;
    float adj = u1 + u2 + u3 + u4 + u5 + u6 + u7 + u8;

    // Transition rule -----------------------------------------------------

    float u = 0;

    // Keep cell surrounded by >= 4 live cells
    u += u0 * step(4, adj);

    // Turn on a dead cell surrounded by >= 5 live cells
    u += (1 - u0) * step(5, adj);

    // Slowly kill a cell surrounded by >= 7-ish live cells to reduce crowding
    u -= 0.01 * u0 * step(7.9, adj);

    // Initialization ------------------------------------------------------

    if (frame <= 1) {
        uvec2 pos = uvec2(texCoord * resolution);
        uint noise = posNoise(pos, seed);
        u = float(step(32768u, noise));
    }

    // Output --------------------------------------------------------------

    int k = int(adj);
    vec3 color = vec3(float(k % 2), float(k / 2 % 2), float(k / 4 % 2));
    fragColor.rgb = u * (0.5 + 0.5 * color);
    fragColor.a = u;
}

// Generate random 16-bit uint for given pixel point.
uint posNoise(uvec2 pos, uint seed) {
    uint code = (pos.x + uint(resolution.x) * pos.y) & 0xFFFFu;
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

uint encode(uint x, uint k) {
    return (x * k) ^ k;
}
