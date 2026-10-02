/**
 * GLSL for the Orbit Lab scene. Every material is a ShaderMaterial so the
 * scene runs on one WebGL 2 context with no post-processing.
 *
 * Colours arrive as uniforms built from the design tokens (scene-colors.ts);
 * no colour is written here. Each fragment shader ends with
 * `colorspace_fragment` so token colours render as they look in CSS.
 */

/* ---------------------------------------------------------------------------
   Rings — ported from React Bits' MagicRings (MIT + Commons Clause, D-014).

   Kept: the `fade` / `ring` functions and the cycling, attenuated rings that
   pulse outward (the look the board picked). Changed for D-010 and our scene:
   - lives on a world-space plane inside the R3F canvas instead of owning a
     second WebGL renderer; screen-space `gl_FragCoord` became plane UVs, and
     the one-pixel width comes from `fwidth` so lines stay crisp at any depth;
   - colours come from tokens; mouse, hover and click-burst inputs removed
     (pointer tilt lives on the headset, and only on the high tier);
   - added: the steady orbit ring, faint guide rings, the left-to-right
     ignition sweep and the satellite on a 9-second loop.
   --------------------------------------------------------------------------- */

export const ringsVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const ringsFragment = /* glsl */ `
uniform float uTime;
uniform float uIgnite;   // 0 → 1: the orbit lights from left to right
uniform float uOpacity;
uniform vec3 uColor;
uniform vec3 uColorTwo;
uniform vec3 uHot;
varying vec2 vUv;

// MagicRings parameters, tuned down for a lab rather than a light show.
const float HP = 1.5707963;
const float CYCLE = 3.45;
const int RING_COUNT = 4;
const float ATTENUATION = 10.0;
const float LINE_THICKNESS = 2.0;
const float BASE_RADIUS = 0.30;
const float RADIUS_STEP = 0.1;
const float SCALE_RATE = 0.1;
const float RING_GAP = 1.5;
const float FADE_IN = 0.7;
const float FADE_OUT = 0.5;
const float PULSE_STRENGTH = 0.14;

const float ORBIT_RADIUS = 0.62;
const float SATELLITE_PERIOD = 9.0;

float fade(float t) {
  return t < FADE_IN ? smoothstep(0.0, FADE_IN, t) : 1.0 - smoothstep(FADE_OUT, CYCLE - 0.2, t);
}

float ring(vec2 p, float ri, float cut, float t0, float px) {
  float t = mod(uTime + t0, CYCLE);
  float r = ri + t / CYCLE * SCALE_RATE;
  float d = abs(length(p) - r);
  float a = atan(abs(p.y), abs(p.x)) / HP;
  float th = max(1.0 - a, 0.5) * px * LINE_THICKNESS;
  float h = (1.0 - smoothstep(th, th * 1.5, d)) + 1.0;
  d += pow(cut * a, 3.0) * r;
  return h * exp(-ATTENUATION * d) * fade(t);
}

void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  float px = max(fwidth(p.x), fwidth(p.y));

  // MagicRings pulses
  vec3 pulses = vec3(0.0);
  float rcf = float(RING_COUNT - 1);
  for (int i = 0; i < RING_COUNT; i++) {
    float fi = float(i);
    vec3 rc = mix(uColor, uColorTwo, fi / rcf);
    float amount = ring(p, BASE_RADIUS + fi * RADIUS_STEP, pow(RING_GAP, fi), i == 0 ? 0.0 : 2.95 * fi, px);
    pulses = mix(pulses, rc, vec3(amount));
  }
  pulses *= PULSE_STRENGTH;

  // The orbit: a crisp core line, a soft halo and two faint guide rings.
  float r = length(p);
  float d = abs(r - ORBIT_RADIUS);
  float orbit = exp(-d / (px * 1.6)) + exp(-d * 40.0) * 0.16;
  float guides = exp(-abs(r - 0.80) / (px * 1.2)) * 0.16 + exp(-abs(r - 0.94) / (px * 1.2)) * 0.08;

  // Ignition sweeps from left to right; the leading edge burns brighter.
  float edge = mix(-1.1, 1.1, uIgnite);
  float lit = smoothstep(edge + 0.06, edge - 0.06, p.x);
  float sweep = exp(-pow((p.x - edge) * 10.0, 2.0)) * step(0.001, uIgnite) * step(uIgnite, 0.999);

  // The satellite travels the orbit once every nine seconds.
  float angle = uTime * 6.2831853 / SATELLITE_PERIOD;
  vec2 satellite = ORBIT_RADIUS * vec2(cos(angle), sin(angle));
  float sd = length(p - satellite);
  float sat = exp(-sd / (px * 2.5)) + exp(-sd * 26.0) * 0.25;

  vec3 orbitColor = mix(uColor, uColorTwo, smoothstep(-0.7, 0.7, p.x));
  vec3 color = (pulses + orbitColor * (orbit + guides)) * lit;
  color += uHot * (sweep * orbit * 2.0 + sat * lit);

  // MagicRings' film-grain noise is dropped: across a plane in world space it
  // outlines the plane's square edge.
  gl_FragColor = vec4(max(color, 0.0) * uOpacity, 1.0);
  #include <colorspace_fragment>
}
`;

/* ---------------------------------------------------------------------------
   Headset lines — drawn in left to right by raising uDraw.
   --------------------------------------------------------------------------- */

export const linesVertex = /* glsl */ `
attribute float aProgress;
varying float vProgress;
varying vec3 vLocal;
void main() {
  vProgress = aProgress;
  vLocal = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const linesFragment = /* glsl */ `
uniform float uDraw;
uniform float uTime;
uniform float uOpacity;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uSilver;
uniform vec3 uHot;
varying float vProgress;
varying vec3 vLocal;
void main() {
  float edge = uDraw * 1.15;
  if (vProgress > edge) discard;

  float head = smoothstep(edge - 0.12, edge, vProgress) * step(uDraw, 0.999);
  vec3 spectrum = mix(uColorA, uColorB, smoothstep(-1.2, 1.2, vLocal.x));
  vec3 color = mix(uSilver, spectrum, 0.6) + uHot * head * 1.5;

  float depth = mix(0.3, 1.0, smoothstep(-1.9, 0.45, vLocal.z));
  float shimmer = 0.88 + 0.12 * sin(uTime * 1.6 + vLocal.x * 2.0);

  gl_FragColor = vec4(color * depth * shimmer * uOpacity, 1.0);
  #include <colorspace_fragment>
}
`;

/* ---------------------------------------------------------------------------
   Particles — scattered at load, they converge onto the headset outline.
   `position` is the target on the outline; `aStart` is the scattered start.
   --------------------------------------------------------------------------- */

export const particlesVertex = /* glsl */ `
uniform float uConverge;
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
attribute vec3 aStart;
attribute float aSeed;
varying float vAlpha;
varying float vSeed;
void main() {
  float delay = aSeed * 0.35;
  float t = clamp((uConverge - delay) / 0.65, 0.0, 1.0);
  t = 1.0 - pow(1.0 - t, 3.0);

  vec3 p = mix(aStart, position, t);
  p += 0.012 * t * vec3(sin(uTime * 1.3 + aSeed * 40.0), cos(uTime * 1.1 + aSeed * 31.0), 0.0);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  // Capped so particles never balloon into blobs when the camera pushes in.
  gl_PointSize = min(uSize * (0.6 + aSeed) / -mv.z, 6.0) * uPixelRatio;

  float twinkle = 0.5 + 0.5 * sin(uTime * 2.0 + aSeed * 60.0);
  // Bright while travelling; once settled they are faint sparks along the lines.
  vAlpha = smoothstep(0.0, 0.12, uConverge) * mix(0.8, 0.08 + 0.2 * twinkle, t);
  vSeed = aSeed;
}
`;

export const particlesFragment = /* glsl */ `
uniform float uOpacity;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying float vAlpha;
varying float vSeed;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d) * vAlpha * uOpacity;
  gl_FragColor = vec4(mix(uColorA, uColorB, vSeed) * a, 1.0);
  #include <colorspace_fragment>
}
`;

/* ---------------------------------------------------------------------------
   Stars — three depth layers; each layer drifts and parallaxes on its own.
   --------------------------------------------------------------------------- */

export const starsVertex = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
attribute float aSeed;
varying float vAlpha;
varying float vSeed;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uPixelRatio * (0.5 + aSeed) * (10.0 / -mv.z);
  vAlpha = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (0.4 + aSeed) + aSeed * 90.0));
  vSeed = aSeed;
}
`;

export const starsFragment = /* glsl */ `
uniform float uOpacity;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying float vAlpha;
varying float vSeed;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.1, d) * vAlpha * uOpacity;
  gl_FragColor = vec4(mix(uColorA, uColorB, step(0.82, vSeed)) * a, 1.0);
  #include <colorspace_fragment>
}
`;

/* ---------------------------------------------------------------------------
   Horizon — a dark planet whose rim catches the spectrum, plus the glow of
   light rising from it (the Reflect-style horizon from the board).
   --------------------------------------------------------------------------- */

export const planetVertex = /* glsl */ `
varying vec3 vNormal;
varying vec3 vViewDir;
varying float vWorldX;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vec4 mv = viewMatrix * world;
  vNormal = normalize(normalMatrix * normal);
  vViewDir = normalize(-mv.xyz);
  vWorldX = world.x;
  gl_Position = projectionMatrix * mv;
}
`;

export const planetFragment = /* glsl */ `
uniform float uIntensity;
uniform vec3 uBody;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec3 vNormal;
varying vec3 vViewDir;
varying float vWorldX;
void main() {
  // The camera grazes the planet's cap, so a soft fresnel would light all of
  // it; a steep exponent keeps the light to a thin crest — the "low horizon".
  float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), 30.0);
  vec3 spectrum = mix(uColorA, uColorB, smoothstep(-7.0, 7.0, vWorldX));
  gl_FragColor = vec4(uBody + spectrum * rim * 1.3 * uIntensity, 1.0);
  #include <colorspace_fragment>
}
`;

export const glowVertex = ringsVertex;

export const glowFragment = /* glsl */ `
uniform float uIntensity;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec2 vUv;
void main() {
  // An ellipse of light centred on the horizon line, wide and shallow.
  vec2 p = (vUv - 0.5) * vec2(2.0, 2.0);
  float d = length(vec2(p.x, p.y * 3.2));
  float glow = exp(-d * 3.6) * 0.32;
  vec3 color = mix(uColorA, uColorB, smoothstep(-0.8, 0.8, p.x));
  gl_FragColor = vec4(color * glow * uIntensity, 1.0);
  #include <colorspace_fragment>
}
`;
