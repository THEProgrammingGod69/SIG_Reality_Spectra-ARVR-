# Session handoff — start here in a new chat

Snapshot of where the project stands, so a fresh session can continue without the
old conversation. Read in this order: this file → `CLAUDE.md` → `docs/DECISIONS.md`
→ `docs/ARCHITECTURE.md` → `docs/OPEN_ITEMS.md`.

## State (as of 2026-10-02)

| Item          | Value                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------- |
| Repo          | github.com/THEProgrammingGod69/SIG_Reality_Spectra-ARVR- (private), `main`                    |
| Local folder  | `D:\Academic Nottes VIT\SIG\SIG_Draft_Code`                                                   |
| Hosting       | **Netlify** (D-025)                                                                           |
| Last commit   | `0560575` — Stage 6 (tag `stage-6`, pushed)                                                   |
| Rollback tags | `stage-1` – `stage-6`, `architecture-v2`, `architecture-v3`                                   |
| Done          | Stages 1–6, all committed, tagged and pushed                                                  |
| Next          | **Stage 7 — events and gallery** (brief below). Start only when Arnav says go                 |
| Gates         | `pnpm check` + `pnpm test:e2e` green (see Stage 6 below); `pnpm test:live` waits for accounts |
| Credentials   | **Placeholders** (D-030): swap list at the top of `docs/OPEN_ITEMS.md`                        |

## Start of the next chat

1. Read this file, then `CLAUDE.md`, `docs/DECISIONS.md` (D-001 – D-030),
   `docs/ARCHITECTURE.md`, `docs/OPEN_ITEMS.md`, `src/lib/data/README.md`,
   `src/lib/schemas/README.md`, `src/lib/auth/README.md` and
   `src/components/admin/README.md`.
2. Report which Stage 7 inputs are still missing, then wait for Arnav's go.

Working locally: `.env.local` has a generated `AUTH_SECRET` and
`ADMIN_EMAILS="dryerisdry@gmail.com"`; `pnpm dev` → `/admin` → "Sign in
(development)".

## Stage 7 brief — events and gallery, admin ↔ public

1. **Uploader** (`src/components/admin`): new record id in the browser, WebP
   compression, `/api/admin/upload` ticket, PUT to R2 with progress and retry,
   width/height measured, alt text required; poster crop locked to one ratio.
2. **/admin/events**: list by phase (draft, current, awaiting, timeline);
   editor for details, registration link and poster; for ended events the
   recap, photos (≤ 60) and "add to timeline"; add past events directly;
   delete with confirmation. Server Actions through `adminAction()`; forms on
   react-hook-form + `EventInputSchema`; `useUnsavedChanges`; conflict →
   reload.
3. **/admin/gallery**: bulk upload standalone photos with category and alt
   text; edit caption/category; delete.
4. **/events** (public): current events on top with registration link, the
   timeline with photos (`getPublicEvents()` inside `<Suspense>`); empty states.
5. **/gallery** (public): both sources, newest first, category filters, load
   more; fixed aspect ratios; survives 0, 1, 3, 40 items (rule 9).
6. Tests: save → visible on the public page at the next load; phases; uploads
   checked; layouts at 0/1/40 items.

**Inputs needed (OPEN_ITEMS):** #15 past events with photos, #16 a sample
registration link, #17 poster aspect ratio, #18 first standalone photos; and
**#9 Upstash + #10 R2** — without them the editors cannot save, so Stage 7
would need a local in-memory store mode to be tested end to end (decide at the
start of Stage 7).

## Stage 6 — what was built

- **Auth.js** `next-auth@5.0.0-beta.32` (pinned): Google provider (switches on
  with its keys), JWT sessions for 8 hours, allowlist re-checked every request,
  verified Google emails only. `/api/auth/[...nextauth]`.
- **Development sign-in** (option 1, D-030): allowlisted email, no password;
  only under `next dev` or `AUTH_DEV_SIGN_IN=true`, never on Netlify (env
  guard, CONTEXT check, session rejected where disabled).
- **Three locks**: `src/proxy.ts` (redirect to `/admin/login?callbackUrl=`, no
  open redirect), the `(panel)` layout, `adminAction()` in every Server
  Action. `ActionResult` + `toActionFailure()` in `src/lib/action-result.ts`.
- **Admin shell**: sidebar (`lg`+) / top bar + sheet, signed-in email,
  sign-out, "view the live site"; in-house toasts (`useToast`, `notify`);
  unsaved-changes guard (`useUnsavedChanges`, `GuardedLink`).
- **Dashboard**: upcoming events, events awaiting the timeline, new requests,
  recruitment status (honest "data store not connected" state without
  Upstash), and a **Setup** checklist from `src/lib/integrations.ts`.
- **Tool pages** render inside the panel with `PlannedTool` ("Built in Stage
  7/8") until their screens exist.
- **shadcn subset** reviewed against the rules; colour aliases in
  `globals.css`; tokens `--z-overlay`, `--z-toast`, `--dur-toast`.
- Upload route: 503 with a clear message when R2 is not configured.
- Fixed: blank `NEXT_PUBLIC_*` values in `.env.local` no longer fail the build.
- Docs: D-030, `docs/SETUP_AUTH.md`, placeholder swap list in OPEN_ITEMS.
- Tests: auth policy, action results, toasts, env guard (unit); signed-out
  redirects, allowlist refusal, sign-in/out, callback safety, dashboard, tool
  pages, mobile menu, upload route signed in (e2e).

## Stage 5 — what was built

- **Hosting moved to Netlify** (D-025): Upstash used directly, files in
  **Cloudflare R2** (presigned PUT via `aws4fetch`), `DATA_NAMESPACE`
  (replacing `REDIS_KEY_PREFIX`) prefixes Redis keys and R2 objects, and the
  build refuses a production deploy not on `prod` or a preview on `prod`.
  Netlify lists Cache Components as supported; confirm on the first real save
  (OPEN_ITEMS #26).
- **Schemas** (`src/lib/schemas`): shared `fields.ts` with `entitySchemas()`
  (input + record from one field list), `category`, `image`, `upload`,
  `event` (+ derived phases), `gallery`, `team`, `recruitment`,
  `sponsorship`. `content.ts` reuses the shared fields; the
  `InterimRecruitment` schema was deleted — `recruitment.json` is validated by
  `RecruitmentInputSchema` (D-028).
- **Repository** (`src/lib/data`, D-029): two ports (`RecordStore`,
  `ObjectStorage`) with Upstash/R2 and in-memory adapters; one generic
  repository (`entity.ts`) with validation on write and read, `updatedAt`
  concurrency, file verification and cleanup, cache tags; atomic writes by a
  Lua script. Public reads in `index.ts` are `'use cache'` + `cacheTag`;
  `getPublicEvents()` splits current/timeline after `connection()`.
- **Uploads**: `/api/admin/upload` (same-site + session check, fails closed via
  the `getAdminSession()` stub), `media.ts` (tickets, HEAD-verified attach,
  deletes). Limits: images 5 MB, PDF 10 MB.
- **Product changes**: categories hackathon · competition · workshop · other
  (D-026); team = core + domain secretaries, no team on Home (D-027);
  recruitment opens with the form alone and the page says the roles PDF is
  "coming soon" (D-028).
- **Tools**: `pnpm seed [--demo]` (`scripts/seed.mts`), `pnpm test:live`
  (store contract + full lifecycle against real Upstash/R2 in a throwaway
  namespace, checking nothing is left behind). Setup guide:
  `docs/SETUP_STORAGE.md`.
- Tests: store contract, repositories, media, schemas, env guard (unit); upload
  route fails closed, Home has no team, roles-PDF placeholder (e2e).

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
