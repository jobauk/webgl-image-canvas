#version 300 es

precision highp float;

uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform bool u_horizontal;

uniform float u_brightness;
uniform float u_contrast;
uniform float u_exposure;

in vec2 v_position;

out vec4 outColor;

#define F_LOBES 2.0

float sinc(float x) {
    if (x == 0.0) {
        return 1.0;
    }

    x = 3.14159265359 * x;
    return sin(x) / x;
}

float lanczos(float x) {
    if ((-F_LOBES < x) && (x < F_LOBES)) {
        return sinc(x) * sinc(x / F_LOBES);
    }

    return 0.0;
}

#define s 5.0

vec4 textureLanczosHorizontal(sampler2D tex, vec2 pos, vec2 texSize) {
    vec4 color = vec4(0.0);
    float weight = 0.0;

    for (float i = -s; i <= s; ++i) {
        vec2 offset = vec2(i, 0.0);
        vec2 sampleUV = (pos + offset) / texSize;
        float dx = offset.x / s;
        float w = lanczos(dx);
        color += texture(tex, sampleUV) * w;
        weight += w;
    }

    return color / weight;
}

vec4 textureLanczosVertical(sampler2D tex, vec2 pos, vec2 texSize) {
    vec4 color = vec4(0.0);
    float weight = 0.0;

    for (float i = -s; i <= s; ++i) {
        vec2 offset = vec2(0.0, i);
        vec2 sampleUV = (pos + offset) / texSize;
        float dy = offset.y / s;
        float w = lanczos(dy);
        color += texture(tex, sampleUV) * w;
        weight += w;
    }

    return color / weight;
}

void main() {
    vec4 color = u_horizontal ? textureLanczosHorizontal(u_image, v_position, u_resolution) : textureLanczosVertical(u_image, v_position, u_resolution);

    // contrast + brightness
    color.rgb = (color.rgb - 0.5) * u_contrast + 0.5 + u_brightness;

    // exposure
    color.rgb *= pow(2.0, u_exposure);

    outColor = color;
}
