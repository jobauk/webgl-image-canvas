#version 300 es

uniform vec2 u_resolution;
uniform mat3 u_matrix;
uniform int u_flipY;

in vec2 a_position;

out vec2 v_position;

void main() {
    vec2 position = (u_matrix * vec3(a_position, 1)).xy;

    vec2 zeroToOne = position / u_resolution;
    vec2 clipSpace = zeroToOne * 2.0 - 1.0;

    gl_Position = vec4(clipSpace * vec2(1, u_flipY), 0, 1);
    v_position = a_position;
}
