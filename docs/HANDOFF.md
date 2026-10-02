# Session handoff — start here in a new chat

Snapshot of where the project stands, so a fresh session can continue without the
old conversation. Read in this order: this file → `CLAUDE.md` → `docs/DECISIONS.md`
→ `docs/ARCHITECTURE.md` → `docs/OPEN_ITEMS.md`.

## State (as of 2026-10-02)

| Item          | Value                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Repo          | github.com/THEProgrammingGod69/SIG_Reality_Spectra-ARVR- (private), `main`               |
| Local folder  | `D:\Academic Nottes VIT\SIG\SIG_Draft_Code`                                              |
| Last commit   | `f05ad06` — Stage 4 (tag `stage-4`, pushed)                                              |
| Rollback tags | `stage-1` – `stage-4`, `architecture-v2`, `architecture-v3`                              |
| Done          | Stages 1–4, all committed, tagged and pushed                                             |
| Next          | **Stage 5 — data layer** (brief below). Start only when Arnav says go                    |
| Gates         | `pnpm check` + `pnpm test:e2e` green (93 unit, 57 e2e; e2e also on the production build) |

## Start of the next chat

1. Read this file, then `CLAUDE.md`, `docs/DECISIONS.md` (D-001 – D-024),
   `docs/ARCHITECTURE.md`, `docs/OPEN_ITEMS.md`, `src/lib/data/README.md` and
   `src/lib/schemas/README.md`. No need to re-read the Stage 2–4 source unless a
   change touches it.
2. Report which Stage 5 inputs are still missing, then wait for Arnav's go.

## Stage 5 brief — data layer (schemas, repository, uploads, cache tags)

Build the data layer only — **no admin UI** (Stage 6+) and no public page changes
beyond what is needed to prove reads work. Field lists, keys and blob paths are
already specified in `src/lib/schemas/README.md` and `src/lib/data/README.md`.

1. **Schemas** in `src/lib/schemas/`: `category.ts` (shared enum), `event.ts`,
   `gallery.ts`, `team.ts`, `recruitment.ts`, `sponsorship.ts`. One schema per
   entity (rule 3), inferred types exported, valid/invalid Vitest cases.
   `RecruitmentSettings` must accept today's `src/content/recruitment.json`
   shape so Stage 8 can swap it in (D-024).
2. **Repository** in `src/lib/data/` (the only place importing `@upstash/redis` /
   `@vercel/blob`; the ESLint rule already enforces it): `keys.ts` (all keys from
   `REDIS_KEY_PREFIX`), `tags.ts`, `events.ts`, `gallery.ts`, `team.ts`,
   `recruitment.ts`, `sponsorships.ts`, `media.ts`. Behind interfaces so Postgres
   can replace Redis later.
   - Multi-key writes in MULTI transactions; `updatedAt` optimistic concurrency
     with a clear "changed by someone else" error.
   - Validate with Zod on every write **and** read; skip + log corrupt records.
   - Event phase derived at request time (current / awaiting timeline /
     timeline), never stored; "now" never inside `'use cache'` (rule 12).
3. **Caching:** public reads are `'use cache'` functions with `cacheTag`; write
   helpers call `updateTag` (Server-Action-only) — a write without its tag is an
   incomplete write (rule 10). Gallery reads carry `events` + `gallery`.
4. **Uploads:** `/api/admin/upload` token route + `media.ts` (type/size limits,
   path under the record, verify URLs on attach, delete on replace/remove).
   Session check is a stub until Stage 6 adds Auth.js — must fail closed.
5. **Seed script** (idempotent) and tests against a test key prefix: create → list
   → update → delete leaves no orphaned keys or blobs. Next 16 notes in
   CLAUDE.md §4 (`updateTag`, `cacheTag`, `connection()`).
6. Docs: decisions, CLAUDE.md status, OPEN_ITEMS, READMEs. Gates, commit, tag
   `stage-5` only on Arnav's go.

**Inputs needed before Stage 5 (OPEN_ITEMS #8–#12):**

| #   | Input                                                                                      |
| --- | ------------------------------------------------------------------------------------------ |
| 8   | Vercel project under the **club** account, repo connected                                  |
| 9   | Upstash Redis via Vercel Marketplace, `vercel env pull` → `.env.local`                     |
| 10  | Vercel Blob store, token in env                                                            |
| 11  | Confirm categories: workshop · hackathon · meetup · talk · competition · other             |
| 12  | Team hierarchy levels (e.g. faculty, leadership, leads, members) and what counts as "core" |

Without #8–#10 the schemas, keys, tags and logic can still be built and unit-tested
against an in-memory fake; live Redis/Blob tests wait for the accounts.

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
