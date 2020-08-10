#version 330

uniform vec2 resolution;
uniform sampler2D sampler;
out vec4 fragColor;

void main()
{
    vec2 st = gl_FragCoord.xy / resolution;

    ivec2 xy = ivec2(gl_FragCoord.xy);
    float u1 = texelFetch(sampler, xy + ivec2(+1,  0), 0).a;
    float u2 = texelFetch(sampler, xy + ivec2( 0, -1), 0).a;
    float u3 = texelFetch(sampler, xy + ivec2(-1,  0), 0).a;
    float u4 = texelFetch(sampler, xy + ivec2( 0, +1), 0).a;

    float a = sin(52 * st.x) * exp(-5 * (1 - st.y));
    a += dot(vec4(0.5, -0.2, -0.1, 0.9), vec4(u1, u2, u3, u4));
    a = clamp(a, 0, 1);

    fragColor.r = 1 + 2 * min(a - 0.25, 0);
    fragColor.g = 1 + 1 * min(a - 0.50, 0);
    fragColor.b = 1 - 0.5 * a;
    fragColor.a = a;
}
