#version 330

#pragma frag:canvas 500 300
#pragma frag:scale 2
#pragma frag:wrap mirror
#pragma frag:fps 60

uniform sampler2D sampler;
uniform vec2 resolution;
uniform vec2 mouse;
uniform int frame;

in vec2 texCoord;
out vec4 fragColor;


void main() {
    // Positions of generation and vanishing points in tex coordinates. The
    // size is in pixels.
    const vec2 whitehole = vec2(0.3, 0.5);
    const vec2 blackhole = vec2(0.7, 0.5);
    const float holeSize = 5;

    // Initial velocity field and quantity field.
    const vec2 initU = vec2(0, 0);
    const float initQ = 0.5;

    // Simulation speed (0,*).
    const float dt = 0.24;
    const float accel = 0.24;

    vec2 texel = 1 / resolution;
    vec4 s0 = texture(sampler, texCoord);
    vec4 s1 = texture(sampler, texCoord + texel * vec2(-1, 0));
    vec4 s2 = texture(sampler, texCoord + texel * vec2(+1, 0));
    vec4 s3 = texture(sampler, texCoord + texel * vec2(0, -1));
    vec4 s4 = texture(sampler, texCoord + texel * vec2(0, +1));

    // Extract simulation quantities. The velocity field u.xy and quantity
    // field q are affine-encoded in the RGB channels. By using the offsets,
    // we sacrifice precision for visual cutesy.
    vec2 u0 = 4 * (s0.rg - 0.75);
    vec2 u1 = 4 * (s1.rg - 0.75);
    vec2 u2 = 4 * (s2.rg - 0.75);
    vec2 u3 = 4 * (s3.rg - 0.75);
    vec2 u4 = 4 * (s4.rg - 0.75);
    float q0 = 2 * (s0.b - 0.5);
    float q1 = 2 * (s1.b - 0.5);
    float q2 = 2 * (s2.b - 0.5);
    float q3 = 2 * (s3.b - 0.5);
    float q4 = 2 * (s4.b - 0.5);

    // Update quantity by the continuity equation.
    float outflux =
        (q2 * u2.x - q1 * u1.x) / 2 +
        (q4 * u4.y - q3 * u3.y) / 2;

    // Toy effect: Modulate timestep depending on the quantity. This breaks the
    // physics but produces a beautiful scene.
    float local_dt = dt * smoothstep(0, 0.9, q0);
    float q = q0 - local_dt * outflux;

    // Our toy model: The velocity field is accelerated by the gradient of the
    // quantities.
    vec2 grad = vec2(q2 - q1, q4 - q3) / 2;
    vec2 u = u0 - accel * grad;

    // Prevent saturation.
    u *= 0.99;

    u = clamp(u, -1, 1);
    q = clamp(q, 0, 1);

    // Generation point and vanishing point.
    q = mix(q, 1, exp(-length((whitehole - texCoord) * resolution / holeSize)));
    q = mix(q, 0, exp(-length((blackhole - texCoord) * resolution / holeSize)));

    float init = step(float(frame), 1);
    u = mix(u, initU, init);
    q = mix(q, initQ, init);

    fragColor.rg = 0.75 + 0.25 * u;
    fragColor.b = 0.5 + 0.5 * q;
}
