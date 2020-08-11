#version 330

#pragma frag:canvas 1280 800
#pragma frag:scale  1.0
#pragma frag:fps    60.0

uniform vec2 resolution;
uniform sampler2D sampler;
out vec4 fragColor;

void main()
{
    vec2 st = gl_FragCoord.xy / resolution;

    fragColor.r = 0.5 + 0.5 * st.x;
    fragColor.g = 1.0 - 0.5 * st.y;
    fragColor.b = 0.5 + 0.5 * st.y;
}
