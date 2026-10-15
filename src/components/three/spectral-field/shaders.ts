/**
 * GLSL for the Spectral Field (D-038): light falling into the lab through
 * haze, behind an inner page's opening. One full-screen triangle pair, one
 * fragment shader, no post-processing.
 *
 * Inspired by React Bits' LightRays and Beams (both on `ogl`, which this
 * project does not use, D-011): written fresh for three.js. Colours arrive as
 * uniforms built from the design tokens; no colour is written here. The time
 * uniform does not follow the clock: the host advances it only while the page
 * settles and while the visitor moves (scene `uTime`, see the scene module).
 */

export const fieldVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  // A screen-filling plane: the camera is irrelevant.
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const fieldFragment = /* glsl */ `
uniform float uTime;
uniform float uReveal;   // 0 → 1 as the page opens
uniform vec2 uAspect;    // (width / height, 1)
uniform vec2 uPointer;   // -1 … 1, eased
uniform vec3 uViolet;
uniform vec3 uAzure;
uniform vec3 uOrchid;
uniform vec3 uCyan;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 p = vUv * uAspect;

  // The light source: above the top-right corner, leaning toward the pointer.
  vec2 source = vec2(uAspect.x * (0.86 + uPointer.x * 0.05), 1.22 + uPointer.y * 0.04);
  vec2 d = p - source;
  float angle = atan(d.x, -d.y);
  float dist = length(d);

  // Rays: two sets of soft blades turning slowly at different rates, broken
  // up by haze so no blade is a hard line.
  float haze = fbm(vec2(angle * 2.2, dist * 1.4 - uTime * 0.05));
  float raysA = smoothstep(0.55, 1.0, sin(angle * 11.0 + uTime * 0.11 + haze * 2.4));
  float raysB = smoothstep(0.7, 1.0, sin(angle * 19.0 - uTime * 0.07 + haze * 1.6));
  float rays = raysA * 0.7 + raysB * 0.45;

  // Falloff from the source, and the floor of drifting haze.
  float falloff = exp(-dist * 1.15);
  float fog = fbm(p * 2.1 + vec2(uTime * 0.025, -uTime * 0.018));

  // Colour runs across the spectrum with the angle, warmed by the fog.
  float hue = clamp(angle * 0.55 + 0.5, 0.0, 1.0);
  vec3 colour = mix(uOrchid, uAzure, hue);
  colour = mix(colour, uViolet, fog * 0.6);
  colour = mix(colour, uCyan, raysB * 0.25);

  float light = (rays * 0.65 + fog * 0.3) * falloff;
  // Keep the text side calm: the field thins toward the left and the floor.
  light *= smoothstep(-0.1, 0.75, vUv.x) * smoothstep(0.0, 0.55, vUv.y);
  light *= uReveal * 0.45;

  gl_FragColor = vec4(colour * light, light);
  #include <colorspace_fragment>
}
`;
