# `src/components/motion`

Reusable animation primitives. Built in **Stage 2**, extended in **Stage 3**; see
them all at `/dev/motion` (development only).

| File                    | What it is                                                          |
| ----------------------- | ------------------------------------------------------------------- |
| `use-reduced-motion.ts` | `useReducedMotion()` hook + `prefersReducedMotion()` live check     |
| `smooth-scroll.tsx`     | `<SmoothScroll />` — Lenis on GSAP's ticker, ScrollTrigger synced   |
| `reveal.tsx`            | `<Reveal>` — fade and rise once, when scrolled into view            |
| `stagger.tsx`           | `<Stagger>` — the same for each direct child, `--stagger` apart     |
| `focus-text.tsx`        | `<FocusText>` — our TrueFocus (D-009): words dim, corners translate |
| `enter-on-scroll.ts`    | the shared entrance used by Reveal and Stagger                      |
| `magnetic.tsx`          | `<Magnetic>` — our Magnet: pull toward a mouse pointer (Stage 3)    |
| `tilt.tsx`              | `<Tilt>` — our TiltedCard: a 4° lean toward the mouse (Stage 9)     |
| `use-motion-tokens.ts`  | `useMotionTokens()` — live tokens for render-time props (Stage 3)   |
| `scroll-lock.ts`        | `lockScroll()` for overlays; also stops Lenis (Stage 3)             |

Tokens and GSAP setup live in `src/lib/motion/` (`tokens.ts`, `gsap.ts`).

Rules:

- Animate `transform` and `opacity` only — no exceptions (D-009).
- Durations, easings, stagger and travel come from the motion tokens in
  `globals.css`, read at runtime with `readMotionTokens()`. Never a literal.
- Reduced motion: the tokens collapse to 0, and every primitive also checks the
  preference and renders static. Lenis switches off.
- Never hide content ahead of time. No JS, or content already on screen at load,
  means no animation — not a flash.
- Clean up only what you created: wrap tweens in `gsap.context(..., element)` and
  `revert()` it. Never `ScrollTrigger.getAll().forEach(kill)`.
- Import `gsap` / `ScrollTrigger` from `@/lib/motion/gsap`, not the package, so
  plugins are registered once.

The page transition lives with the site chrome (`components/site/page-transition.tsx`);
the magnetic button is `Button`/`ButtonLink` with `magnetic`; `<Tilt>` is on
About's team cards. Overlays (the admin sheet and dialogs) use the keyframe
tokens in globals.css (`animate-fade-*`, `-rise-*`, `-slide-*`, D-033).
