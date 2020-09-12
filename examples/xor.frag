#version 330

#pragma frag:canvas 49 49
#pragma frag:scale 6
#pragma frag:fps 30

uniform sampler2D sampler;
uniform vec2 resolution;
uniform int frame;
in vec2 texCoord;
out vec4 fragColor;

int decode(float x) {
    return int(clamp(x * 8, 0, 7));
}

float encode(int x) {
    return float(x) / 7.5;
}

vec3 colorCode(int x) {
    return vec3(float(x % 2), float(x / 2 % 2), float(x / 4 % 2));
}

void main() {
    vec2 texel = 1 / resolution;
    int u0 = decode(texture(sampler, texCoord).a);
    int u1 = decode(texture(sampler, texCoord + texel * vec2( 0, +1)).a);
    int u2 = decode(texture(sampler, texCoord + texel * vec2(+1,  0)).a);
    int u3 = decode(texture(sampler, texCoord + texel * vec2( 0, -1)).a);
    int u4 = decode(texture(sampler, texCoord + texel * vec2(-1,  0)).a);

    int a = u1 - u0;
    int b = u2 - u0;
    int c = u3 - u0;
    int d = u4 - u0;
    int G = (a * b + c * d) % 13;
    int H = (a * d + b * c) % 17;
    int u = clamp(abs(G ^ H), 0, 7);

    // Initialization
    if (frame <= 1) {
        ivec2 pos = ivec2(texCoord * resolution);
        int x = pos.x % 11;
        int y = pos.y % 9;
        u = x ^ (8 - y) % 8;
    }

    fragColor.rgb = colorCode(u);
    fragColor.a = encode(u);
}
