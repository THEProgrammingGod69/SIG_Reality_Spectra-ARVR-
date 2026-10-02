# Session handoff — start here in a new chat

Snapshot of where the project stands, so a fresh session can continue without the
old conversation. Read in this order: this file → `CLAUDE.md` → `docs/DECISIONS.md`
→ `docs/ARCHITECTURE.md` → `docs/OPEN_ITEMS.md`.

## State (as of 2026-10-02)

| Item          | Value                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Repo          | github.com/THEProgrammingGod69/SIG_Reality_Spectra-ARVR- (private), `main`               |
| Local folder  | `D:\Academic Nottes VIT\SIG\SIG_Draft_Code`                                              |
| Rollback tags | `stage-1` – `stage-3`, `architecture-v2`, `architecture-v3`; `stage-4` once committed    |
| Done          | Stages 1–3 (committed); **Stage 4** (content layer + pages + SEO) — built, gates green   |
| Next          | Commit + tag `stage-4` + push (Arnav's go), then Stage 5 — data layer (needs accounts)   |
| Gates         | `pnpm check` + `pnpm test:e2e` green (93 unit, 57 e2e; e2e also on the production build) |

## Stage 4 — what was built

- `src/content/*.json` (site, domains, contact, interim recruitment) validated by
  `src/lib/schemas/content.ts`, read through server-only `src/lib/content.ts`;
  a bad file fails the build naming file and field (D-023).
- Pages: Home (hero one-liner, who we are under the horizon glow, mission and
  vision, domains overview, core-team empty state), About (story, at a glance,
  mission and vision, team empty state), Recruitment (interim open status with
  Apply now + QR, all ten domains by group), Contact (details with "Coming soon"
  placeholders, map placeholder, Instagram/WhatsApp with QR codes, honest
  sponsorship notice).
- QR codes generated from the links on the server (`qrcode`), verified to decode.
- SEO: `pageMetadata()` per page (title, canonical, OpenGraph, Twitter),
  `sitemap.xml`, Organization JSON-LD on Home.
- `pnpm check:launch` — fails while contact placeholders remain (Stage 10 gate).
- Decisions D-023 (content + QR), D-024 (interim recruitment, placeholders).

## Stage 3 — what was built

- Tokens in `globals.css`: fonts (Space Grotesk · Inter · JetBrains Mono via
  `next/font`, four files), fluid type scale, spacing rhythm, containers, radii,
  shadows, glass, gradients, layers, ambient animations.
- `src/components/ui/`: Button/ButtonLink (incl. StarBorder `star` variant and
  `magnetic`), Card family, Badge, Container, Section, Heading, Text/Eyebrow,
  Field/Input/Textarea/Select, Modal, Skeleton, EmptyState, Icon, BrandMark/Badge.
- `src/components/site/`: fixed header (glass on scroll), PillNav (`lg`+),
  MobileMenu (StaggeredMenu rebuilt, accessible), footer, recruitment banner
  slot, page transition (`(site)/template.tsx`).
- Brand pack in (D-021); favicon + Apple icon; OPEN_ITEMS #2 and #3 resolved.
- `/dev/ui` playground; `cn()` (D-019); contrast audit test; shell e2e suite
  (keyboard, mobile menu, 360px overflow on every page, footer, icons).
- Decisions D-019 – D-022.

## Stage 2 — what was built

- Motion tokens in `globals.css` (D-015 also adopted the Style Board colours);
  `src/lib/motion/` reads them, sets up GSAP + CustomEase, and picks hero tiers.
- `src/components/motion/`: `SmoothScroll` (Lenis on GSAP's ticker), `Reveal`,
  `Stagger`, `FocusText`, `useReducedMotion`.
- Hero: `src/components/sections/hero/` + `src/components/three/orbit-lab/`.
  One canvas (MagicRings ported, D-016), token SVG still (D-017), intro ≈ 1.35 s
  once per session, scroll-out pin on 3D tiers (D-018). three.js is a lazy
  chunk; the static tier never loads it.
- `/dev/motion` playground (404 in production). `/?hero-tier=low|high|static`
  forces a tier in development.
- Still open: Android 50 fps sign-off (OPEN_ITEMS #1). Desktop frame rates
  could not be measured headless (software WebGL); check on real hardware.
- Windows note: Windows PowerShell's `Set-Content`/`Get-Content` mangle UTF-8
  (BOM, `—` → `â€”`). Edit files with an editor or Node, never PowerShell piping.

## Working agreement with Arnav

- One stage per session. Finish locally → `pnpm check` + `pnpm test:e2e` → commit
  → `git tag -a stage-N` → push branch **and** tag.
- When he says "you decide" / "-": make the call, explain why, log it as a new
  entry in `docs/DECISIONS.md` (`Decided by: lead`). Never edit old entries.
- Keep `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/OPEN_ITEMS.md` and the plan PDF
  consistent. PDF source: `D:\Academic Nottes VIT\SIG\plan_pdf_source`
  (`node render.cjs && python finalize.py`); copy output into `docs/`.
- Windows machine: long bash heredocs break in the tool — write scripts to a file.

## Stage 2 brief — animation system + hero (done; kept for reference)

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
