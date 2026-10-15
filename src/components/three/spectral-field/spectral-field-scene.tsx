'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { Color, NoBlending, PlaneGeometry, ShaderMaterial, type Mesh } from 'three';

import { parseDuration, readCssVar } from '@/lib/motion/tokens';

import { fieldFragment, fieldVertex } from './shaders';

/**
 * The Spectral Field (D-038) — light falling through the lab's haze behind an
 * inner page's opening. One canvas, one WebGL context: the only one on the
 * page (D-010). This module is the lazy chunk; the section that hosts it is
 * `sections/intro-field.tsx`.
 *
 * It never moves on its own for long (WCAG 2.2.2). Time advances while the
 * page settles (`--dur-settle`, under 5 s) and afterwards only with the
 * visitor's own movement: pointer travel and scrolling put energy in, which
 * drains away within a second or two, and when it is gone the canvas stops
 * drawing (`frameloop="demand"`) until the next movement.
 */

export type FieldInput = {
  /** Pointer, -1 … 1 across the viewport; `null` when it has left. */
  pointer: { x: number; y: number } | null;
  /** Movement energy put in so far; it only grows. The scene drains what is new. */
  energy: number;
  /**
   * When the intro mounted (`performance.now()`). The settle is counted from
   * here, not from the first frame: a slow chunk shortens it, never extends it.
   */
  startedAt: number;
};

type FieldClock = {
  /** Seconds left to settle, fixed at the first frame; `null` before it. */
  settle: number | null;
  /** Field time: what the shader animates by. */
  time: number;
  /** Real seconds since the first frame. */
  elapsed: number;
  /** Energy not yet drained. */
  energy: number;
  /** The input's energy total at the last frame. */
  seen: number;
  pointer: { x: number; y: number };
};

type SpectralFieldSceneProps = {
  /** Draw only while the intro is on screen. */
  active: boolean;
  input: RefObject<FieldInput>;
  /** Called once, after the first frame has rendered. */
  onReady: () => void;
};

const FIELD_TOKENS = {
  uViolet: '--color-spectra-violet',
  uAzure: '--color-spectra-azure',
  uOrchid: '--color-spectra-orchid',
  uCyan: '--color-spectra-cyan',
} as const;

/** Energy drains by this factor per second; below `REST`, drawing stops. */
const DRAIN_PER_SECOND = 0.12;
const REST = 0.002;
/** How much field time one unit of energy buys per second. */
const ENERGY_SPEED = 2.4;
/** Seconds the light takes to come up after the first frame (as the canvas fades in). */
const REVEAL = 1;

function createResources() {
  const colours = Object.fromEntries(
    Object.entries(FIELD_TOKENS).map(([uniform, token]) => {
      const value = readCssVar(token);
      return [uniform, { value: value ? new Color().setStyle(value) : new Color() }];
    }),
  );
  const material = new ShaderMaterial({
    vertexShader: fieldVertex,
    fragmentShader: fieldFragment,
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uAspect: { value: [1, 1] },
      uPointer: { value: [0, 0] },
      ...colours,
    },
    transparent: true,
    blending: NoBlending,
    depthTest: false,
    depthWrite: false,
  });
  return { geometry: new PlaneGeometry(2, 2), material };
}

/**
 * One frame of the field's clock. Mutates `clock` (a ref's value) in place,
 * outside the component, as the hero does with its scene state. Returns
 * whether anything is still moving, so the demand loop keeps drawing.
 */
function advance(clock: FieldClock, input: FieldInput, step: number, settleFor: number): boolean {
  // The settle is what is left of `--dur-settle` since the intro mounted.
  clock.settle ??= Math.max(0, settleFor - (performance.now() - input.startedAt) / 1000);
  const settle = clock.settle;

  // New energy from the visitor, then the drain.
  clock.energy = Math.min(1, clock.energy + Math.max(0, input.energy - clock.seen));
  clock.seen = input.energy;
  clock.energy *= Math.pow(DRAIN_PER_SECOND, step);

  // While settling the field runs at full speed, easing to a stop at the end.
  const settling = clock.elapsed < settle;
  const settleSpeed = settling ? 1 - clock.elapsed / Math.max(settle, 0.001) : 0;
  clock.elapsed += step;
  clock.time += step * Math.max(settleSpeed, clock.energy * ENERGY_SPEED);

  // The pointer eases toward the visitor's hand (or back to centre).
  const target = input.pointer ?? { x: 0, y: 0 };
  const follow = 1 - Math.pow(0.02, step);
  clock.pointer.x += (target.x - clock.pointer.x) * follow;
  clock.pointer.y += (target.y - clock.pointer.y) * follow;
  const pointerMoving =
    Math.abs(target.x - clock.pointer.x) > 0.001 || Math.abs(target.y - clock.pointer.y) > 0.001;

  return settling || clock.elapsed < REVEAL || clock.energy > REST || pointerMoving;
}

/** Write the clock into the field's uniforms. */
function applyClock(mesh: Mesh | null, clock: FieldClock, aspect: number) {
  const material = mesh?.material;
  if (!(material instanceof ShaderMaterial)) return;
  const uniforms = material.uniforms;
  uniforms.uTime!.value = clock.time;
  uniforms.uReveal!.value = Math.min(1, clock.elapsed / REVEAL);
  uniforms.uAspect!.value = [aspect, 1];
  uniforms.uPointer!.value = [clock.pointer.x, clock.pointer.y];
}

function Field({ input, onReady }: Omit<SpectralFieldSceneProps, 'active'>) {
  const resources = useMemo(() => createResources(), []);
  useEffect(
    () => () => {
      resources.geometry.dispose();
      resources.material.dispose();
    },
    [resources],
  );

  const meshRef = useRef<Mesh>(null);
  const clockRef = useRef<FieldClock>({
    settle: null,
    time: 0,
    elapsed: 0,
    energy: 0,
    seen: 0,
    pointer: { x: 0, y: 0 },
  });
  const settleRef = useRef(parseDuration(readCssVar('--dur-settle')));
  const readyRef = useRef(false);
  const invalidate = useThree((state) => state.invalidate);

  useFrame((frame, delta) => {
    const moving = advance(
      clockRef.current,
      input.current,
      Math.min(delta, 0.1),
      settleRef.current,
    );
    applyClock(
      meshRef.current,
      clockRef.current,
      frame.size.width / Math.max(frame.size.height, 1),
    );

    if (!readyRef.current) {
      readyRef.current = true;
      onReady();
    }
    if (moving) invalidate();
  });

  return (
    <mesh
      ref={meshRef}
      geometry={resources.geometry}
      material={resources.material}
      frustumCulled={false}
    />
  );
}

/** Wakes the demand loop when the visitor moves. */
function Wake() {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    const wake = () => invalidate();
    window.addEventListener('pointermove', wake, { passive: true });
    window.addEventListener('scroll', wake, { passive: true });
    return () => {
      window.removeEventListener('pointermove', wake);
      window.removeEventListener('scroll', wake);
    };
  }, [invalidate]);
  return null;
}

export default function SpectralFieldScene({ active, input, onReady }: SpectralFieldSceneProps) {
  // Soft light needs few pixels: render under the device ratio and let CSS scale it.
  const dpr = Math.min(window.devicePixelRatio || 1, 1) * 0.75;

  return (
    <Canvas
      dpr={dpr}
      frameloop={active ? 'demand' : 'never'}
      flat
      gl={{ antialias: false, alpha: true, stencil: false, depth: false }}
    >
      <Field input={input} onReady={onReady} />
      <Wake />
    </Canvas>
  );
}
