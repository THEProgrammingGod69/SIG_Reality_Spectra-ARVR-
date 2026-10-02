# Animation references — Stage 2 input

Recordings are gitignored. This file is committed so the intent behind the
motion stays reviewable. Stage 2 was built from the inputs below.

## References

### 1. Reflect landing page (`Stage_2_Designing/reflect 1.png`, Figma "Top 10 best modern websites")

- **Copy:** the glowing planet horizon with light rising from it; concentric
  orbital rings; a star field for depth; one luminous object per section.
- **Ignore:** the blue-purple monotone (we use the logo's spectrum, ≤ 10% of the screen).
- **Where it applies:** hero — the Orbit Lab horizon and rings.

### 2. React Bits MagicRings

- **Copy:** the attenuated rings that pulse outward on a cycle.
- **Ignore:** its own WebGL renderer, mouse/hover/click inputs, film grain.
- **Where it applies:** hero rings, ported into the R3F scene (D-016).

### 3. React Bits TrueFocus

- **Copy:** a corner-bracket frame moving from word to word, others dimmed.
- **Ignore:** the `filter: blur()` and the animated frame size (D-009).
- **Where it applies:** the hero name during the intro (`FocusText`).

### 4. SIG Style & Motion Board / Technical Plan §09

- **Copy:** the motion tokens, the first-load choreography (headset outline draws
  in → particles converge → ring ignites left to right → horizon fades up), the
  idle (float, ±6° pointer tilt, 9 s satellite, three star depths) and the
  pinned 150vh scroll-out.
- **Ignore:** the 2.4 s intro length and blur-to-sharp headline (D-010, D-009).

## Landing concept

A visitor lands in a dark lab. The club's name is already there, as text, on the
left. On the right a wireframe VR headset draws itself in with a spectrum stroke
while particles converge onto it, the orbit ring behind it ignites from left to
right, and a planet's rim catches the light low on the horizon — all within about
1.35 s, skippable, once per session. Scrolling pins the hero: the camera pushes
in toward the lens, the rings open around the viewer, and the page takes over.

## Mood words

Cinematic, realistic XR lab, restrained, engineered — **not** gaming neon. Glows
are light sources, not decoration.

## 3D models

None — procedural geometry (`src/components/three/orbit-lab/headset-geometry.ts`).
