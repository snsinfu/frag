#version 330

uniform vec2 resolution;
out vec4 fragColor;

void main()
{
    vec2 st = gl_FragCoord.xy / resolution;

    fragColor.r = 0.5 + 0.5 * st.x;
    fragColor.g = 1.0 - 0.5 * st.y;
    fragColor.b = 0.5 + 0.5 * st.y;
}
