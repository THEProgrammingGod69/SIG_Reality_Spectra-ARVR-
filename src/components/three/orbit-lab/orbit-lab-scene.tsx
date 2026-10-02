'use client';

import { PerformanceMonitor } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  ShaderMaterial,
  type Group,
  type Mesh,
  type Object3D,
} from 'three';

import { HERO_TIER_BUDGET, type HeroTier } from '@/lib/motion/hero-tier';
import { seededRandom } from '@/lib/motion/random';

import { createHeadsetLines, samplePointsOnSegments, type HeadsetLines } from './headset-geometry';
import { readSceneColors, type SceneColors } from './scene-colors';
import { type HeroSceneState } from './scene-state';
import * as glsl from './shaders';

/**
 * Orbit Lab — the hero scene (D-001). One canvas, one WebGL context (D-010):
 * a star field in three depths, a dark planet whose rim is the low spectrum
 * horizon, the ported MagicRings orbit, and the wireframe headset with the
 * particles that converge onto it.
 *
 * This module is the lazy chunk: three.js, R3F and drei load only when the
 * device tier calls for a canvas. Everything it creates is disposed on unmount.
 */

type SceneTier = Exclude<HeroTier, 'static'>;

export type OrbitLabSceneProps = {
  tier: SceneTier;
  /** Mutable choreography values, written by GSAP and read here every frame. */
  stateRef: RefObject<HeroSceneState>;
  /** Render only while the hero is on screen. */
  active: boolean;
  /** Called once, after the first frame has rendered. */
  onReady: () => void;
};

/* Camera and layout, in world units. */
const CAMERA_Z = 7;
const FOV = 40;
const VISIBLE_HEIGHT = 2 * CAMERA_Z * Math.tan(((FOV / 2) * Math.PI) / 180);

/** The rings plane; the orbit ring sits at 0.62 of its half-size (shaders.ts). */
const RINGS_SIZE = 6.6;
const ORBIT_DIAMETER = RINGS_SIZE * 0.62;

/** Wide layout from 23:20 — the same breakpoint the static still uses. */
const WIDE_ASPECT = 23 / 20;

/**
 * The horizon planet: its crest sits this far below centre, behind the orbit —
 * at 75% of the height on wide screens, and lower (≈ 91%) on tall ones, where
 * the text sits at the bottom and must not cross the bright crest.
 */
const PLANET_RADIUS = 14;
const HORIZON_Y_WIDE = -2.2;
const HORIZON_Y_TALL = -3.6;
const HORIZON_Z = -5;

/** Where the scroll-out push stops: just in front of the lens. */
const CAMERA_END_Z = 1.4;

const STAR_LAYERS = [
  { z: -6, share: 0.45, drift: 0.006, parallax: 0.18 },
  { z: -11, share: 0.35, drift: 0.004, parallax: 0.1 },
  { z: -18, share: 0.2, drift: 0.002, parallax: 0.04 },
] as const;

/** Headset idle motion and pointer tilt (±6°, from the board). */
const TILT_RADIANS = (6 * Math.PI) / 180;
const IDLE_SWAY_RADIANS = (3 * Math.PI) / 180;
/** Resting three-quarter pose, turned toward the text and seen from just above. */
const REST_YAW = -0.38;
const REST_PITCH = 0.2;

/** Frame-rate-independent smoothing toward a target. */
function damp(current: number, target: number, lambda: number, delta: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * delta));
}

function smootherstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function createParticles(headset: HeadsetLines, count: number) {
  const random = seededRandom(7);
  const targets = samplePointsOnSegments(headset.segments, count, random);
  const starts = new Float32Array(count * 3);
  const seeds = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const u = random() * 2 - 1;
    const theta = random() * Math.PI * 2;
    const radius = 2.5 + random() * 3;
    const ring = Math.sqrt(1 - u * u);
    starts[i * 3] = ring * Math.cos(theta) * radius;
    starts[i * 3 + 1] = u * radius * 0.7;
    starts[i * 3 + 2] = ring * Math.sin(theta) * radius;
    seeds[i] = random();
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(targets, 3));
  geometry.setAttribute('aStart', new Float32BufferAttribute(starts, 3));
  geometry.setAttribute('aSeed', new Float32BufferAttribute(seeds, 1));
  return geometry;
}

function createStarLayer(count: number, z: number, seed: number) {
  const random = seededRandom(seed);
  const distance = CAMERA_Z - z;
  // Generous margins so drift and parallax never reveal an empty edge.
  const halfHeight = distance * Math.tan(((FOV / 2) * Math.PI) / 180) * 1.4;
  const halfWidth = halfHeight * 2.6;
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (random() * 2 - 1) * halfWidth;
    positions[i * 3 + 1] = (random() * 2 - 1) * halfHeight;
    positions[i * 3 + 2] = (random() * 2 - 1) * 1.2;
    seeds[i] = random();
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new Float32BufferAttribute(seeds, 1));
  return geometry;
}

function additive(
  vertexShader: string,
  fragmentShader: string,
  uniforms: ShaderMaterial['uniforms'],
) {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
}

function createMaterials(colors: SceneColors) {
  return {
    rings: additive(glsl.ringsVertex, glsl.ringsFragment, {
      uTime: { value: 0 },
      uIgnite: { value: 0 },
      uOpacity: { value: 1 },
      uColor: { value: colors.orchid },
      uColorTwo: { value: colors.azure },
      uHot: { value: colors.cyan },
    }),
    lines: additive(glsl.linesVertex, glsl.linesFragment, {
      uDraw: { value: 0 },
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uColorA: { value: colors.magenta },
      uColorB: { value: colors.azure },
      uSilver: { value: colors.silver },
      uHot: { value: colors.cyan },
    }),
    particles: additive(glsl.particlesVertex, glsl.particlesFragment, {
      uConverge: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: 18 },
      uPixelRatio: { value: 1 },
      uOpacity: { value: 1 },
      uColorA: { value: colors.violet },
      uColorB: { value: colors.cyan },
    }),
    stars: additive(glsl.starsVertex, glsl.starsFragment, {
      uTime: { value: 0 },
      uSize: { value: 2.2 },
      uPixelRatio: { value: 1 },
      uOpacity: { value: 0.4 },
      uColorA: { value: colors.silver },
      uColorB: { value: colors.cyan },
    }),
    planet: new ShaderMaterial({
      vertexShader: glsl.planetVertex,
      fragmentShader: glsl.planetFragment,
      uniforms: {
        uIntensity: { value: 0 },
        uBody: { value: colors.bg },
        uColorA: { value: colors.violet },
        uColorB: { value: colors.azure },
      },
    }),
    glow: additive(glsl.glowVertex, glsl.glowFragment, {
      uIntensity: { value: 0 },
      uColorA: { value: colors.indigo },
      uColorB: { value: colors.violet },
    }),
  };
}

type SceneResources = {
  colors: SceneColors;
  headset: HeadsetLines;
  particles: BufferGeometry;
  stars: BufferGeometry[];
  materials: ReturnType<typeof createMaterials>;
};

function createResources(tier: SceneTier): SceneResources {
  const budget = HERO_TIER_BUDGET[tier];
  const colors = readSceneColors();
  const headset = createHeadsetLines();

  return {
    colors,
    headset,
    particles: createParticles(headset, budget.particles),
    stars: STAR_LAYERS.map((layer, i) =>
      createStarLayer(Math.round(budget.stars * layer.share), layer.z, 11 + i),
    ),
    materials: createMaterials(colors),
  };
}

function disposeResources(resources: SceneResources) {
  resources.headset.geometry.dispose();
  resources.particles.dispose();
  resources.stars.forEach((geometry) => geometry.dispose());
  Object.values(resources.materials).forEach((material) => material.dispose());
}

/** Write uniform values on an object's ShaderMaterial. */
function setUniforms(object: Object3D | null, values: Record<string, number>) {
  const material = (object as (Object3D & { material?: unknown }) | null)?.material;
  if (!(material instanceof ShaderMaterial)) return;
  for (const [name, value] of Object.entries(values)) {
    const uniform = material.uniforms[name];
    if (uniform) uniform.value = value;
  }
}

function OrbitLab({ tier, stateRef, onReady }: Omit<OrbitLabSceneProps, 'active'>) {
  const budget = HERO_TIER_BUDGET[tier];
  const resources = useMemo(() => createResources(tier), [tier]);
  useEffect(() => () => disposeResources(resources), [resources]);

  // Uniforms are reached through these object refs inside useFrame: refs are
  // the mutable escape hatch, so the memoised resources are never mutated.
  const orbitRef = useRef<Group>(null);
  const headsetRef = useRef<Group>(null);
  const ringsRef = useRef<Mesh>(null);
  const linesRef = useRef<Object3D>(null);
  const particlesRef = useRef<Object3D>(null);
  const planetRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);
  const starRefs = useRef<(Object3D | null)[]>([]);
  const readyRef = useRef(false);
  const tiltRef = useRef({ x: 0, y: 0 });

  useFrame((frame, delta) => {
    const state = stateRef.current;
    const time = frame.clock.elapsedTime;
    const pixelRatio = frame.gl.getPixelRatio();

    // Layout: orbit to the right of the text on wide screens, above it on tall
    // ones. hero-still.tsx mirrors these numbers in CSS — keep them together.
    const aspect = frame.size.width / Math.max(frame.size.height, 1);
    const visibleWidth = VISIBLE_HEIGHT * aspect;
    const wide = aspect >= WIDE_ASPECT;
    const orbitX = wide ? visibleWidth * 0.22 : 0;
    const orbitY = wide ? 0.08 : VISIBLE_HEIGHT * 0.17;
    const scale = Math.min(0.85, (visibleWidth * (wide ? 0.5 : 0.92)) / ORBIT_DIAMETER);

    const orbit = orbitRef.current;
    if (orbit) {
      orbit.position.set(orbitX, orbitY, 0);
      orbit.scale.setScalar(scale);
    }
    const horizonY = wide ? HORIZON_Y_WIDE : HORIZON_Y_TALL;
    planetRef.current?.position.setY(horizonY - PLANET_RADIUS);
    glowRef.current?.position.setY(horizonY);

    // Choreography → uniforms.
    const scroll = smootherstep(state.scroll);
    // The rings fade as they grow, so the push-in never floods the screen with colour.
    setUniforms(ringsRef.current, {
      uTime: time,
      uIgnite: state.ignite,
      uOpacity: 1 - 0.8 * scroll,
    });
    setUniforms(linesRef.current, { uTime: time, uDraw: state.draw });
    setUniforms(particlesRef.current, {
      uTime: time,
      uConverge: state.converge,
      uPixelRatio: pixelRatio,
      uOpacity: 1 - scroll,
    });
    // The star layers share one material, so setting it on the first sets all.
    setUniforms(starRefs.current[0] ?? null, {
      uTime: time,
      uPixelRatio: pixelRatio,
      uOpacity: 0.4 + 0.6 * state.horizon,
    });
    setUniforms(planetRef.current, { uIntensity: state.horizon });
    setUniforms(glowRef.current, { uIntensity: state.horizon * (1 - scroll) });

    // Rings grow as the camera pushes in, so the orbit opens around the viewer.
    ringsRef.current?.scale.setScalar(1 + scroll * 3);

    // Headset: a slow float, plus pointer tilt on the high tier.
    const tiltX = budget.pointerTilt ? -state.pointerY * TILT_RADIANS : 0;
    const tiltY = budget.pointerTilt ? state.pointerX * TILT_RADIANS : 0;
    tiltRef.current.x = damp(tiltRef.current.x, tiltX, 4, delta);
    tiltRef.current.y = damp(tiltRef.current.y, tiltY, 4, delta);

    const headset = headsetRef.current;
    if (headset) {
      headset.position.y = Math.sin(time * 0.8) * 0.06;
      headset.rotation.x = REST_PITCH + tiltRef.current.x;
      headset.rotation.y = REST_YAW + Math.sin(time * 0.25) * IDLE_SWAY_RADIANS + tiltRef.current.y;
    }

    // Stars drift at three speeds; on the high tier, nearer layers parallax more.
    STAR_LAYERS.forEach((layer, i) => {
      const stars = starRefs.current[i];
      if (!stars) return;
      stars.rotation.z += delta * layer.drift;
      stars.position.x = damp(stars.position.x, tiltRef.current.y * layer.parallax * 6, 3, delta);
      stars.position.y = damp(stars.position.y, -tiltRef.current.x * layer.parallax * 6, 3, delta);
    });

    // Scroll-out: the camera pushes in toward the left lens.
    const lensX = orbitX - 0.5 * scale;
    frame.camera.position.set(
      lensX * scroll,
      orbitY * scroll,
      CAMERA_Z + (CAMERA_END_Z - CAMERA_Z) * scroll,
    );

    if (!readyRef.current) {
      readyRef.current = true;
      onReady();
    }
  });

  const { colors, headset, particles, stars, materials } = resources;

  return (
    <>
      <color attach="background" args={[colors.bg]} />

      {stars.map((geometry, i) => (
        <points
          key={STAR_LAYERS[i]!.z}
          ref={(node) => {
            starRefs.current[i] = node;
          }}
          position={[0, 0, STAR_LAYERS[i]!.z]}
          geometry={geometry}
          material={materials.stars}
          frustumCulled={false}
        />
      ))}

      <mesh
        ref={planetRef}
        position={[0, HORIZON_Y_WIDE - PLANET_RADIUS, HORIZON_Z]}
        material={materials.planet}
      >
        <sphereGeometry args={[PLANET_RADIUS, 96, 48]} />
      </mesh>
      <mesh ref={glowRef} position={[0, HORIZON_Y_WIDE, HORIZON_Z + 0.1]} material={materials.glow}>
        <planeGeometry args={[30, 8]} />
      </mesh>

      <group ref={orbitRef}>
        <mesh ref={ringsRef} position={[0, 0, -0.8]} material={materials.rings}>
          <planeGeometry args={[RINGS_SIZE, RINGS_SIZE]} />
        </mesh>
        <group ref={headsetRef}>
          <lineSegments ref={linesRef} geometry={headset.geometry} material={materials.lines} />
          <points
            ref={particlesRef}
            geometry={particles}
            material={materials.particles}
            frustumCulled={false}
          />
        </group>
      </group>
    </>
  );
}

export default function OrbitLabScene({ tier, stateRef, active, onReady }: OrbitLabSceneProps) {
  const budget = HERO_TIER_BUDGET[tier];
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, budget.maxDpr));

  return (
    <Canvas
      dpr={dpr}
      frameloop={active ? 'always' : 'never'}
      flat
      gl={{
        antialias: budget.antialias,
        alpha: false,
        stencil: false,
        powerPreference: 'high-performance',
      }}
      camera={{ fov: FOV, near: 0.1, far: 60, position: [0, 0, CAMERA_Z] }}
    >
      {/* Drops the pixel ratio to 1 if the frame rate falls on a weak GPU. */}
      <PerformanceMonitor onDecline={() => setDpr(1)} />
      <OrbitLab tier={tier} stateRef={stateRef} onReady={onReady} />
    </Canvas>
  );
}
