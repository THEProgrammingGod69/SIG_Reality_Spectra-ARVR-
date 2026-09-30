# Session handoff — start here in a new chat

Snapshot of where the project stands, so a fresh session can continue without the
old conversation. Read in this order: this file → `CLAUDE.md` → `docs/DECISIONS.md`
→ `docs/ARCHITECTURE.md` → `docs/OPEN_ITEMS.md`.

## State (as of 2026-09-30)

| Item          | Value                                                                      |
| ------------- | -------------------------------------------------------------------------- |
| Repo          | github.com/THEProgrammingGod69/SIG_Reality_Spectra-ARVR- (private), `main` |
| Local folder  | `D:\Academic Nottes VIT\SIG\SIG_Draft_Code`                                |
| Last commit   | `bcd10ab` — decisions recorded, standalone gallery, email dropped          |
| Rollback tags | `stage-1`, `architecture-v2`, `architecture-v3` (current)                  |
| Done          | Stage 1 (scaffold, routes as placeholders, env contract, tests, docs)      |
| Next          | **Stage 2 — animation system + Orbit Lab hero** (only when Arnav says go)  |
| Gates         | `pnpm check` + `pnpm test:e2e` all green (22 unit, 16 e2e)                 |

## Working agreement with Arnav

- One stage per session. Finish locally → `pnpm check` + `pnpm test:e2e` → commit
  → `git tag -a stage-N` → push branch **and** tag.
- When he says "you decide" / "-": make the call, explain why, log it as a new
  entry in `docs/DECISIONS.md` (`Decided by: lead`). Never edit old entries.
- Keep `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/OPEN_ITEMS.md` and the plan PDF
  consistent. PDF source: `D:\Academic Nottes VIT\SIG\plan_pdf_source`
  (`node render.cjs && python finalize.py`); copy output into `docs/`.
- Windows machine: long bash heredocs break in the tool — write scripts to a file.

## Stage 2 brief — animation system + hero

Build the motion foundation and the landing hero; nothing else.

1. **Motion tokens** in `globals.css` `@theme`: dur-micro 150ms, short 300ms,
   medium 600ms, long 1200ms; `ease-out-expo` (.16,1,.3,1), `ease-in-out`
   (.65,0,.35,1); stagger 70ms. Reduced-motion collapses them.
2. **Smooth scroll**: Lenis driven by GSAP's ticker (one RAF loop),
   ScrollTrigger synced; add `data-scroll-behavior="smooth"` to `<html>`;
   disabled under `prefers-reduced-motion`.
3. **Primitives** in `src/components/motion/`: `<Reveal>`, `<Stagger>`,
   `FocusText` (our own TrueFocus: opacity + transform only, D-009), and a
   `useReducedMotion` hook. Each cleans up only its own ScrollTriggers.
4. **Hero** (`src/components/three/` + `sections/Hero`): Orbit Lab — dark lab,
   low spectrum horizon, rings, one wireframe headset, built procedurally.
   - **One WebGL context** (D-010): port MagicRings' shader into the R3F scene,
     or use MagicRings alone. No `ogl` (D-011).
   - Name is real text at first paint; intro skippable, once per session;
     content readable ≤ 1.5 s.
   - Device tiers: reduced motion / no WebGL → designed static still; low-power
     → half particles, no pointer tilt; high → full. Canvas lazy-loaded, pauses
     off-screen, disposes on unmount, DPR ≤ 2.
5. **Motion playground** at a dev-only route (excluded from robots/sitemap).
6. **Tests**: e2e that the hero text is visible without JS/WebGL and that
   reduced-motion renders the still; unit tests for tier selection.

Rules that bite here: CLAUDE.md §3 rule 4 (transform/opacity only, no
exceptions), §11 decisions, §12 vendored-code review. Colours stay the neutral
placeholder tokens until Stage 3, or adopt the Style Board palette first if Arnav
approves "tokens before hero".

Still open for Stage 2: a real mid-range Android phone to verify 50 fps.
