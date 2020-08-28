#version 330

#pragma frag:canvas 1200 600
#pragma frag:scale 0.5

uniform vec2 resolution;
uniform float time;
in vec2 texCoord;
out vec4 fragColor;


float f(float x, float t) {
    return sin(x / (1.1 + cos(t)) - t);
}

void main() {
    vec2 margin = vec2(50, 50) / resolution;
    vec2 span = vec2(8, 3);

    // Transform texture coordinates to graph coordinates.
    vec2 panelCoord = (texCoord - margin / 2) / (1 - margin);
    vec2 graphCoord = (panelCoord - 0.5) * span;

    // Compute pixel size in graph coordinates.
    vec2 panelPixel = (1 - margin) / resolution;
    vec2 graphPixel = panelPixel * span;

    // Evaluate the function
    float t = time;
    float y = f(graphCoord.x, t);

    // Paint the background
    fragColor.rgb = vec3(1, 1, 1);

    // Draw xy axes
    if (abs(graphCoord.x) < graphPixel.x || abs(graphCoord.y) < graphPixel.y) {
        fragColor.rgb = vec3(0.5, 0.5, 0.5);
    }

    // Plot the graph of the function
    if (abs(graphCoord.y - y) < graphPixel.y) {
        fragColor.rgb = vec3(1, 0, 0);
    }

    // Letterbox
    if (clamp(panelCoord, 0, 1) != panelCoord) {
        fragColor.rgb = vec3(0, 0, 0);
    }
}
