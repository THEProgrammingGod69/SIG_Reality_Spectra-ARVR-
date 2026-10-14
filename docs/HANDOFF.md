# Session handoff — start here in a new chat

Snapshot of where the project stands, so a fresh session can continue without the
old conversation. Read in this order: this file → `CLAUDE.md` → `docs/DECISIONS.md`
→ `docs/ARCHITECTURE.md` → `docs/OPEN_ITEMS.md`.

## State (as of 2026-10-04)

| Item          | Value                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| Repo          | github.com/THEProgrammingGod69/SIG_Reality_Spectra-ARVR- (private), `main`                                 |
| Local folder  | `D:\Academic Nottes VIT\SIG\SIG_Draft_Code`                                                                |
| Hosting       | **Netlify** (D-025)                                                                                        |
| Last commit   | `b3df807` — quality pass after Stage 10a (tag `stage-10a`, pushed)                                         |
| Rollback tags | `stage-1` – `stage-9`, `stage-10a`, `architecture-v2`, `architecture-v3`                                   |
| Done          | Stages 1–9 and 10a, committed, tagged and pushed; quality pass (D-035)                                     |
| Next          | Stage 10b: go-live with the club's accounts — `docs/GO_LIVE.md`                                            |
| Gates         | `pnpm check` + `pnpm test:e2e` green: 293 unit, 166 e2e on Chromium + mobile WebKit (dev and `CI=1` build) |
| Credentials   | **Placeholders** (D-030): swap list at the top of `docs/OPEN_ITEMS.md`                                     |

## Premium pass (D-037) — after Stage 10a

A design and motion pass over every public page, on branch
`ccr-fb1b4dcd-eu2382` (not yet merged to `main`). React Bits SplitText,
ScrollReveal, SpotlightCard, ScrollVelocity and GlareHover were rebuilt on
rule 4 (`src/components/motion`); `PageIntro` runs under the header over
`LabBackdrop`; `SectionHeading` opens every section; Home gained the domain
ticker and a closing call to action; Events, Gallery, Recruitment, Contact,
the footer and the 404 were reworked. Read D-037 for the calls made, the
review findings that were fixed (trigger ordering with the hero pin, reachable
trigger points, contrast in every state, nothing looping past 5 s) and what
was left alone on purpose. New e2e: `tests/e2e/motion.spec.ts`.

## The XR HUD (D-038) — after the premium pass

On the same branch. The club asked for more motion and nothing generic, so the
site now reads as the lab seen through a headset: a HUD navigation rail with a
lock-on frame (`site/hud-nav.tsx`, replacing PillNav), an aperture-shutter
mobile menu, a targeting reticle that locks onto links (system cursor kept),
a shutter between pages, decoding mono labels, the hero's display frame and
scan, Home's domains on a horizontal rail and its purpose panels stacking,
the footer wordmark floating in, team members as holographic access passes,
the gallery's focus dim and curtain develop, and — on capable devices only —
a light-through-haze shader behind each inner page's opening
(`three/spectral-field`). Read D-038 for every call; new e2e:
`tests/e2e/hud.spec.ts`. The club's Instagram could not be read by tools (login
wall), so no content was taken from it.

## Start of the next chat

1. Read this file, then `CLAUDE.md`, `docs/DECISIONS.md` (D-001 – D-038),
   `docs/ARCHITECTURE.md`, `docs/OPEN_ITEMS.md`, and the READMEs in
   `src/lib/data`, `src/lib/schemas`, `src/lib/auth`, `src/components/admin`.
2. Run `git status` (only the untracked `.claude/` launch config is expected).
3. Report which club inputs have arrived (the checklist below), then wait for
   Arnav's go to run `docs/GO_LIVE.md`.

Working locally: `.env.local` (gitignored) has a generated `AUTH_SECRET`,
`ADMIN_EMAILS="dryerisdry@gmail.com"` and `DATA_BACKEND="local"`. `pnpm dev` →
`/admin` → "Sign in (development)". Local `dev` data in `.data/` has demo
events, photos, team, one request, and recruitment open.

## Working agreement with Arnav (applies to every stage)

- One stage at a time. Analyse → list missing inputs → wait for "go" → build →
  `pnpm check` + `pnpm test:e2e` (dev server **and** `CI=1` production build)
  → report → **do not commit until he says "commit"** → commit, `git tag -a
stage-N`, push branch and tag, then a small "docs: handoff" commit.
- No redundancy or duplication: reuse `entity.ts`, `adminAction()`,
  `FormField`/`inputProps`, `UploadDropzone`/`ImageField`, `EventList`-style
  shared pieces rather than copying.
- "You decide" → decide, explain, log a new `docs/DECISIONS.md` entry.
- Placeholders for anything the club hasn't supplied; add each to the swap list.
- Windows: use PowerShell for `pnpm` (Git Bash's pnpm shim is broken); write
  long edit scripts to a file instead of bash heredocs/`node -e` with
  backticks; prefix Git Bash commands with `MSYS_NO_PATHCONV=1` when passing
  `/paths` as arguments. Never `cd` in Bash without a subshell.
- The browser pane's screenshots often time out (window behind). For visual
  checks use the headless script pattern: Playwright `chromium.launch()` →
  full-page screenshot into the scratchpad → Read the PNG.

---

## Stage 8 — what was built (D-032)

- **/admin/team** (core then secretaries, editor + photo, core reorder) → About
  cards (square photo or initials, secretary's domain).
- **/admin/recruitment** (open, form link, roles PDF) → /recruitment, header
  CTA, mobile-menu "Open now" tag. `recruitment.json` and the empty banner
  slot are gone; an unsaved store means closed. `pnpm seed` needs `--demo`.
- **Contact form** → **/admin/sponsorships** (paged inbox, status, delete).
  Honeypot, Turnstile (fails closed on Netlify without keys), validation,
  3 requests/sender/hour via `RecordStore.hit()` (hashed address).
- Shared kit: `ConfirmDelete`, `SaveBar`, `useRecordVersion`, `CheckboxField`,
  `PdfField`, `publicRead` + `LoadFailed`, `blankToNull` in `src/lib/forms.ts`.
- Fixes: the proxy no longer re-issues the session cookie (prefetches could
  undo sign-out; sessions now a fixed 8 h); local file-store queue is
  process-wide; friendly field messages; e2e waits for streamed content.
- Windows note: Playwright can orphan `next dev`; kill stray node `next`
  processes before a run if port 3000 is taken.

---

## Stage 9 — what was built (D-033)

- **Motion:** admin sheet/dialogs on keyframe tokens (`animate-fade-*`,
  `-rise-*`, `-slide-*`, backdrop in `admin/ui/overlay.ts`); `<Tilt>` on
  team cards; reveals on the Stage 7–8 sections; page fade is plain CSS.
- **Performance:** public client components never import a schema module
  (zod): constants come as props, the contact form loads validation on first
  focus. Image `sizes` match the grids; first gallery tile preloaded.
  Software WebGL (no GPU, headless) gets the static hero. Lighthouse:
  A11y/Best Practices/SEO 100 everywhere, Performance 91–93 (Home ~60 in the
  GPU-less lab).
- **Accessibility:** `tests/e2e/a11y.spec.ts` (axe, WCAG 2.2 AA) on every page,
  key states and every admin screen.
- **Security:** `src/lib/security-headers.ts` via next.config.ts (CSP, HSTS,
  framing, referrer, permissions, COOP; noindex on /admin and /api);
  `tests/e2e/security.spec.ts` fails on any CSP violation.
- **Analytics:** Cloudflare Web Analytics, token `NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN`
  (placeholder: empty).
- **SEO:** `/og/[page]` share images (prerendered, Space Grotesk TTFs in
  `src/assets/fonts`), Event JSON-LD on /events, `<JsonLd>`,
  `src/lib/token-values.ts` (mirrored tokens, unit-tested).
- Lighthouse on Windows here: chrome-launcher cannot spawn Chrome; launch
  Playwright's Chromium with `--remote-debugging-port=9222` and pass
  `--port=9222` to `npx lighthouse`.

---

## Stage 10a and the quality pass — what was built (D-034, D-035)

- **Nightly job:** `POST /api/cron/nightly` (Bearer `CRON_SECRET`) from
  `netlify/functions/nightly.mts` at 21:00 UTC: backup of every record to
  `{ns}/backups/{date}.json` (30 kept), then a sweep of unused uploads (24 h
  grace, key-based matching, refuses to delete more than half).
  `src/lib/data/maintenance.ts`; `pnpm data backups | backup | sweep
[--dry-run] | restore <date> [--yes] [--production]`.
- **Tests:** mobile WebKit (iPhone 14) on the public specs; `pnpm test:deployed`
  against `PLAYWRIGHT_BASE_URL`. Fixed: the contact form wiped text typed
  before hydration (no default values on public forms).
- **Docs:** `docs/handbook/` (coordinators), `docs/GO_LIVE.md` (Stage 10b).
- **Quality pass:** Next.js 16.3.5 → 16.3.8 (critical advisory in `next/og`);
  the hero detects software GPUs by renderer name too (Home mobile Lighthouse
  65 → 92); gallery batches of 30. Lighthouse desktop 99–100, mobile 90–93,
  A11y/Best Practices/SEO 100; 86 internal URLs all 200.
- **Club inputs checklist** (downloadable, for Arnav to fill and share):
  https://claude.ai/artifact/Qbd2QqiCEf3o9mCozJUqb7

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
- `src/components/site/`: fixed header (glass on scroll), PillNav (`lg`+; the
  HUD rail since D-038), MobileMenu (StaggeredMenu rebuilt, accessible; the
  aperture since D-038), footer, recruitment banner
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
