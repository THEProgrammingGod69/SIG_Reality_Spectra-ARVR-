# `src/components/three`

React Three Fiber scenes. Built in **Stage 2**: the Orbit Lab hero (D-001).

| File                            | What it is                                                               |
| ------------------------------- | ------------------------------------------------------------------------ |
| `orbit-lab/orbit-lab-scene.tsx` | the canvas and scene — the lazy chunk (three.js, R3F, drei)              |
| `orbit-lab/shaders.ts`          | GLSL: rings (ported MagicRings, D-016), lines, particles, stars, horizon |
| `orbit-lab/headset-geometry.ts` | the procedural wireframe headset; no `.glb`                              |
| `orbit-lab/scene-colors.ts`     | scene colours read from the design tokens                                |
| `orbit-lab/scene-state.ts`      | the numbers GSAP drives and `useFrame` reads                             |
| `use-hero-tier.ts`              | the device tier, decided once after hydration                            |

The hero section that hosts it is `src/components/sections/hero/`.

Rules:

- **One WebGL context per hero** (D-010), at most two heavy WebGL components per
  page, three.js only — no `ogl` (D-011).
- The canvas is lazy-loaded (`next/dynamic`, `ssr: false`) and only for the low and
  high tiers. The static tier (reduced motion, no WebGL 2) never downloads it.
- Device tiers come from `src/lib/motion/hero-tier.ts`. Low = half the particles
  and stars, no pointer tilt, DPR ≤ 1.5. High = full, DPR ≤ 2. `PerformanceMonitor`
  drops DPR to 1 if the frame rate falls.
- Rendering stops when the hero is off screen (`frameloop="never"`).
- Everything created outside JSX is disposed on unmount.
- No colour literals: colours are uniforms built from CSS tokens.
- Uniforms are written through object refs inside `useFrame`, never by mutating
  memoised values (the React Compiler lint rejects that).
- Dev override: `/?hero-tier=low|high|static` (ignored in production).
