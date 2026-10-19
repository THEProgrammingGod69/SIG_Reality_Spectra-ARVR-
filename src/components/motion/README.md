# `src/components/motion`

Reusable animation primitives. Built in **Stage 2**, extended in **Stage 3**; see
them all at `/dev/motion` (development only).

| File                    | What it is                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------- |
| `use-reduced-motion.ts` | `useReducedMotion()` hook + `prefersReducedMotion()` live check                         |
| `smooth-scroll.tsx`     | `<SmoothScroll />` — Lenis on GSAP's ticker, ScrollTrigger synced                       |
| `reveal.tsx`            | `<Reveal>` — fade and rise once, when scrolled into view                                |
| `stagger.tsx`           | `<Stagger>` — the same for each direct child, `--stagger` apart                         |
| `focus-text.tsx`        | `<FocusText>` — our TrueFocus (D-009): words dim, corners translate                     |
| `enter-on-scroll.ts`    | the shared entrance used by Reveal and Stagger                                          |
| `magnetic.tsx`          | `<Magnetic>` — our Magnet: pull toward a mouse pointer (Stage 3)                        |
| `tilt.tsx`              | `<Tilt>` — our TiltedCard: a 4° lean toward the mouse (Stage 9)                         |
| `use-motion-tokens.ts`  | `useMotionTokens()` — live tokens for render-time props (Stage 3)                       |
| `scroll-lock.ts`        | `lockScroll()` for overlays; also stops Lenis (Stage 3)                                 |
| `split-text.tsx`        | `<SplitText>` — our SplitText: heading words rise out of line masks (D-037)             |
| `scroll-words.tsx`      | `<ScrollWords>` — our ScrollReveal: words brighten as you read (D-037)                  |
| `spotlight.tsx`         | `<Spotlight>` — our SpotlightCard: pointer light + rim (`Card spotlight`)               |
| `marquee.tsx`           | `<Marquee>` — our ScrollVelocity: type that slides as the page scrolls (D-037)          |
| `scroll-progress.tsx`   | `<ScrollProgress>` — the header's reading-progress hairline (D-037)                     |
| `timeline-rail.tsx`     | `<TimelineRail>` + `<TimelineMarker>` — the events rail that fills as you read (D-037)  |
| `scroll-refresh.tsx`    | `<ScrollRefresh>` — re-measures triggers after navigations and streamed content (D-037) |
| `decode-text.tsx`       | `<DecodeText>` — our DecryptedText: a mono label decodes like a HUD readout (D-038)     |
| `parallax.tsx`          | `<Parallax>` — decoration that drifts, turns or opens as a portal with the scroll       |
| `stack.tsx`             | `<Stack>` — our ScrollStack: sticky panels that stack and step back (D-038)             |
| `scroll-float.tsx`      | `<ScrollFloat>` — our ScrollFloat: characters float up into place (footer wordmark)     |
| `holo-foil.tsx`         | `<HoloFoil>` — the foil sheen on a team access pass, after ProfileCard (D-038)          |

Tokens and GSAP setup live in `src/lib/motion/` (`tokens.ts`, `gsap.ts`), and
`scroll-point.ts` turns "top 85%" into a trigger point the reader can always
reach (clamped to the page's maximum scroll), so nothing near the end of a short
page is left hidden (D-037).

Rules:

- Animate `transform` and `opacity` only — no exceptions (D-009).
- Durations, easings, stagger and travel come from the motion tokens in
  `globals.css`, read at runtime with `readMotionTokens()`. Never a literal.
- Reduced motion: the tokens collapse to 0, and every primitive also checks the
  preference and renders static. Lenis switches off.
- Never hide content ahead of time. No JS, or content already on screen at load,
  means no animation — not a flash. The one exception is a page's title
  (`SplitText play="load"`), which plays in CSS from the very first paint, so
  there is nothing to flash.
- CSS delays are multiples of `--stagger` (`calc(var(--stagger) * n)`), so they
  collapse under reduced motion with everything else.
- ScrollTrigger starts and ends come from `reachablePoint()`, not a bare
  `'top 85%'` string.
- Clean up only what you created: wrap tweens in `gsap.context(..., element)` and
  `revert()` it. Never `ScrollTrigger.getAll().forEach(kill)`.
- Import `gsap` / `ScrollTrigger` / `Flip` from `@/lib/motion/gsap`, not the
  package, so plugins are registered once. Flip (layout changes, e.g. the
  gallery's filters) is used with `scale: true`, so it moves with `transform`.
- Text that changes (`DecodeText`) keeps the real text in the DOM at every
  moment; the changing copy is `aria-hidden`. Mono labels only (D-038).
- Scroll-driven distances are tokens too (`--motion-depth`, `--motion-turn`,
  `--motion-portal`, `--motion-shelve`), read with `readCssVar`.

The page transition lives with the site chrome (`components/site/page-transition.tsx`);
the magnetic button is `Button`/`ButtonLink` with `magnetic`; `<Tilt>` is on
About's team cards. Overlays (the admin sheet and dialogs) use the keyframe
tokens in globals.css (`animate-fade-*`, `-rise-*`, `-slide-*`, D-033).
