# `src/components/motion`

Reusable animation primitives: `<Reveal>`, `<Stagger>`, `<Parallax>`,
`<SplitTextReveal>`, `<MagneticButton>`, `<TiltCard>`, `<PageTransition>`.

Rules:

- Animate `transform` and `opacity` only.
- Every primitive is `prefers-reduced-motion` aware and degrades to a simple
  fade, or to nothing.
- Durations and easings come from the motion tokens, never from inline literals.

Built in **Stage 2**.
