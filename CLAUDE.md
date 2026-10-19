# CLAUDE.md — SIG Reality Spectra website

Read this file first, in every session, before writing any code.

It is the contract for this project: what we are building, what is already
decided, and the rules that do not get renegotiated stage by stage.

---

## 1. Product context

The official website of **SIG Reality Spectra**, the AR/VR/XR special interest
group at **VIT Pune**.

**Public visitors never log in.** Six public pages:

| Page           | Shows                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| `/` Home       | Hero (name + one-line intro) · mission, vision and short "about us" · domains overview (no team, D-027) |
| `/about`       | Club details · the core team, then the secretary of each domain (name, photo, position), D-027          |
| `/events`      | Current event on top (details + registration link) · timeline of past events with photos                |
| `/gallery`     | All photos — event photos, club photos and the Git archive with clips — filterable by category (D-039)  |
| `/recruitment` | The club's domains, always · roles PDF and Google Form link, **only while recruitment is open**         |
| `/contact`     | Contact details · sponsorship/collaboration request form (goes to the admin panel)                      |

**Admins** (2–3 allowlisted emails, with Google or the admin password — D-039)
sign in at `/admin` to manage five things:

| Admin page            | Does                                                                                                                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/admin/events`       | Add the current event (details + registration link). Once it ends it is kept for later; the admin adds a recap and photos and puts it on the timeline. Past events can also be added directly. |
| `/admin/gallery`      | Upload standalone club photos with a category. Photos of timeline events and the club archive (Git, D-039) reach the gallery automatically.                                                    |
| `/admin/team`         | Add members with name, position and photo: the core team, and one secretary per domain (D-027). They appear on About.                                                                          |
| `/admin/recruitment`  | Open/close recruitment, upload the roles and responsibilities PDF, set the Google Form link.                                                                                                   |
| `/admin/sponsorships` | Read sponsorship requests submitted from `/contact` (admin inbox only — no email).                                                                                                             |     |

- **Admin changes must appear on the live site immediately after save, with NO
  redeploy.** This is the single hardest constraint in the project and it drives
  the entire data and caching design.
- **No traditional database.** Data lives in Upstash Redis (JSON records) and
  Cloudflare R2 (images and the recruitment PDF), behind a repository layer so
  Postgres can replace Redis later without touching a single UI file.
- **Hosted on Netlify** (D-025). Upstash and R2 are used directly, not through a
  hosting marketplace, so they move with the club, not with the host. Until
  they exist, Netlify's built-in Blobs storage backs the same ports
  (`DATA_BACKEND=netlify-blobs`, the default on Netlify without Upstash, D-039).
- **The gallery has three sources.** The photos of timeline events (uploaded
  once, in the event), standalone club photos (uploaded in `/admin/gallery`) and
  the club archive (photos and clips committed under `public/archive/`, described
  by `src/content/archive.json`, D-039), shown together and grouped by one shared
  category list.
- **Registration and applications happen elsewhere.** Events link out to their
  registration page (typically VIERP); recruitment links out to a Google Form.
- **Handover matters.** The club committee changes every year. A coordinator who
  has never seen the code must be able to add an event from a written guide, and
  admin access must transfer by editing one environment variable.

### Audience and tone

Aesthetic brief from the club: _cinematic, realistic XR lab — not gaming neon_.
Professional, dark, mobile-first. When reviewing a page, ask: does this look like
a lab that builds real things, or a gaming landing page?

---

## 2. Locked tech stack — do not substitute

| Layer              | Choice                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Framework          | Next.js 16 (App Router) + TypeScript strict                                                                             |
| Package manager    | pnpm                                                                                                                    |
| Styling            | Tailwind CSS v4 + shadcn/ui (**admin only**); `cn()` = clsx + tailwind-merge (D-019)                                    |
| Icons              | lucide-react, 1.5 stroke, via `<Icon>` (D-019)                                                                          |
| 3D                 | React Three Fiber + `@react-three/drei`                                                                                 |
| Scroll/timeline    | GSAP + ScrollTrigger                                                                                                    |
| UI micro-animation | Motion (formerly Framer Motion)                                                                                         |
| Smooth scroll      | Lenis                                                                                                                   |
| Data               | Upstash Redis (serverless KV, created directly on upstash.com — D-025); Netlify Blobs until then (D-039)                |
| Files              | Cloudflare R2 (S3-compatible), signed with `aws4fetch` — D-025                                                          |
| Validation         | Zod (shared schemas)                                                                                                    |
| Admin auth         | Auth.js (`next-auth@5.0.0-beta.32`, pinned) — Google or `ADMIN_PASSWORD`, JWT sessions, allowlist in env (D-030, D-039) |
| Forms              | react-hook-form + Zod                                                                                                   |
| Spam protection    | Cloudflare Turnstile + honeypot                                                                                         |
| Analytics          | Cloudflare Web Analytics, cookieless, public site only (D-033)                                                          |
| Testing            | Playwright (E2E) + Vitest (schemas/utils) + axe-core (accessibility, D-033)                                             |
| Hosting            | Netlify + club-owned GitHub org (D-025); Vercel as a second host (D-040)                                                |

If a library looks like a better fit mid-build, raise it — do not silently swap it.

---

## 3. Permanent rules

These are not style preferences. Breaking one is a bug.

1. **Never hardcode colours, spacing, fonts or durations. Use design tokens.**
   Tokens live in `src/app/globals.css` under `@theme`. Changing one token value
   must change the whole site. No raw hex or magic px inside a component.

2. **All data access goes through `src/lib/data`.** UI never imports the Redis or
   R2 client directly. This is enforced by a `no-restricted-imports` ESLint
   rule, so violating it fails `pnpm lint`.

3. **One Zod schema per admin-editable entity**, used by the admin form, the
   server action and the public renderer. Never a second, slightly different copy
   of a field's rules. Validate on every write _and_ every read.

4. **Animate only `transform` and `opacity`. Respect `prefers-reduced-motion`
   everywhere.** Every motion primitive degrades to a simple fade, or to nothing.
   There are **no exceptions**: a vendored effect that animates `filter`, `width`,
   `height` or position is rewritten or rejected (docs/DECISIONS.md, D-009).

5. **Every stage ends with `pnpm lint`, `pnpm typecheck` and `pnpm build`
   passing** — plus `pnpm test` and `pnpm test:e2e`. `pnpm check` runs the lot.

### Rules that follow from the product

6. **The public site links to the admin in one place only:** a small "Admin"
   link to `/admin/login` in the footer's bottom row, `rel="nofollow"`, never
   prefetched, never in the header or the sitemap (D-039, superseding "from
   nowhere"). An e2e test checks exactly one such link per page, in the footer.

7. **Every admin route is `noindex, nofollow`** and disallowed in `robots.txt`.

8. **Never trust the proxy alone.** `proxy.ts` guards `/admin/*`, _and_ every
   server action re-checks the session itself — by wrapping its body in
   `adminAction()` (`src/lib/auth/admin-action.ts`).

9. **Nothing an admin does may make the public site look broken.** Cards use
   fixed aspect ratios, titles are line-clamped, grids use `auto-fill minmax`,
   and every list has an empty state. Layouts must survive 0, 1, 3 and 40 items,
   and a 400-character title.

10. **A write that does not revalidate its cache tags is an incomplete write.**

11. **Files never travel through a Server Action.** Admin uploads go browser →
    R2 with a short-lived presigned URL from `/api/admin/upload`; a Server Action
    then attaches the URLs to the record (verifying each file) and calls
    `updateTag`. See
    `src/lib/data/README.md`.

12. **"Now" is never cached.** Whether an event is current or past is decided at
    request time, after `await connection()`, outside any `'use cache'` function.

---

## 4. Next.js 16 — things that differ from older knowledge

This project runs **Next.js 16.3.8** (16.3.5 until a security update, D-035). Several APIs changed from 14/15. Check
`node_modules/next/dist/docs/` before using an API you are unsure about.

- **Turbopack is the default** for `next dev` and `next build`; no `--turbopack`
  flag. `next dev` writes to `.next/dev`, so dev and build can run concurrently.
- **`middleware` is renamed to `proxy`.** Use `proxy.ts` exporting `proxy()`. The
  edge runtime is not supported there; the proxy runtime is Node.js.
- **Request APIs are async.** `params`, `searchParams`, `cookies()`, `headers()`
  and `draftMode()` are Promises and must be awaited. Sync access is gone.
- **`revalidateTag(tag)` now needs a second argument**, a `cacheLife` profile:
  `revalidateTag('events', 'max')`. It is stale-while-revalidate.
- **`updateTag(tag)` is new and Server-Action-only.** It expires _and_ refreshes
  within the same request, giving read-your-writes semantics.
  **This is the correct API for our "admin saves, live site updates now" rule** —
  `revalidateTag` alone would leave an admin staring at their own stale data.
- **`cacheLife` and `cacheTag` are stable** — no `unstable_` prefix — but
  `cacheTag` and `'use cache'` **require `cacheComponents: true`**, which this
  project enables in `next.config.ts`. With it on, data is dynamic by default,
  pages prerender a static shell, and anything request-time (cookies, headers,
  the current time) must sit inside `<Suspense>` or after `await connection()`.
  The build fails loudly if it does not.
- **`next lint` is removed.** `pnpm lint` calls the ESLint CLI directly and
  `next build` no longer lints, so linting is a separate gate.
- **`next typegen`** generates `PageProps<'/route'>`, `LayoutProps<'/route'>` and
  `RouteContext<'/route'>`. Use them instead of hand-writing prop types.
  `pnpm typecheck` runs typegen first.
- **`typedRoutes` is on.** A typo in a `<Link href>` is a build error. The route
  helpers in `src/lib/site.ts` deliberately return _inferred_ types, because
  annotating them as `SiteRoute[]` would widen `href` to `string` and break this.
- **`next/image` defaults changed:** `qualities` defaults to `[75]`,
  `minimumCacheTTL` to 4 hours, and `16` was dropped from `imageSizes`.
- **Parallel route slots require an explicit `default.js`** or the build fails.
- **Next.js no longer overrides `scroll-behavior`** during navigation. If smooth
  scrolling is set globally, add `data-scroll-behavior="smooth"` to `<html>`.
  This matters when Lenis lands in Stage 2.
- `serverRuntimeConfig` / `publicRuntimeConfig` are removed — use env vars.

---

## 5. Folder conventions

```
src/
  app/
    (site)/          public routes — one folder per sitemap page
    admin/           admin routes (noindex, never linked publicly): login/ + (panel)/  (Stage 6)
    dev/             developer tools: /dev/ui, /dev/motion — 404 in production
    api/admin/upload presigned-upload route (Stage 5)
    api/auth/        Auth.js endpoints (Stage 6)
    api/local-media/ app-hosted files (local, Netlify Blobs, Vercel Blob): receives and serves uploads (Stage 7, D-039)
    api/cron/nightly backup + orphan sweep, Bearer CRON_SECRET (Stage 10, D-034)
    og/[page]        each public page's share image, prerendered            (Stage 9)
    globals.css      design tokens live here, in @theme
    robots.ts
  components/
    ui/              design-system primitives          (Stage 3)
    site/            site chrome: header, HudNav, mobile menu, reticle, footer   (Stage 3, D-038)
    motion/          reusable animation primitives     (Stage 2)
    three/           R3F scenes                        (Stage 2)
    sections/        composed page sections            (Stages 2, 4, 7, 8)
    admin/           admin shell, toasts, unsaved-changes guard; ui/ = reviewed shadcn (Stages 6–8)
  lib/
    data/            repository layer — ONLY place that touches Redis/R2      (Stage 5)
    schemas/         Zod schemas: one per entity, shared by forms and data   (Stage 5)
    auth/            Auth.js config, access policy, session checks, adminAction()   (Stage 6);
                     the proxy imports only base + proxy-auth + session-check (D-041)
    action-result.ts the one result shape admin Server Actions return     (Stage 6)
    integrations.ts  which outside services have credentials (dashboard)  (Stage 6)
    dates.ts         dates in the club's time zone                        (Stage 6)
    forms.ts         helpers shared by admin and public forms (blankToNull) (Stage 8)
    security-headers.ts  CSP and security headers for next.config.ts      (Stage 9)
    token-values.ts  token values for places that cannot read CSS (OG images, theme colour) (Stage 9)
    turnstile.ts     the contact form's spam check: mode + verification   (Stage 8)
    motion/          motion tokens reader, GSAP setup, hero device tiers, reachable scroll points (Stages 2, D-037)
    cn.ts            the one class-name helper (public UI and shadcn admin)
    image-sizes.ts   coverSizes(): next/image `sizes` for a photo cropped to its frame (D-041)
    contrast.ts      WCAG contrast maths for the token audit and /dev/ui
    env.ts           server env, validated with Zod (server-only)
    env.public.ts    NEXT_PUBLIC_* env, safe in the browser
    site.ts          sitemap, nav and structural club constants — single source of truth
    content.ts       the validated src/content files (server-only)          (Stage 4)
    metadata.ts      pageMetadata(): title, canonical, OpenGraph per page   (Stage 4)
    structured-data.ts  schema.org JSON-LD for the club                     (Stage 4)
  assets/            brand logo images (Stage 3); fonts/ = OG-image TTFs, server-only (Stage 9)
  content/           site, domains, contact, archive — JSON, validated at build time
  proxy.ts           the /admin guard (Next 16's renamed middleware)       (Stage 6)
scripts/             seed.mts — pnpm seed --demo; data.mts — pnpm data (backup, sweep, restore)
netlify/functions/   nightly.mts — the scheduled call to /api/cron/nightly   (Stage 10)
.data/               local data mode records + uploads, gitignored (D-031)  (Stage 7)
tests/
  unit/              Vitest — schemas, utilities, data layer on in-memory adapters
  e2e/               Playwright
references/          design + animation inputs, never shipped
docs/                architecture, decisions, setup guides; handbook/ for coordinators; GO_LIVE.md
```

Each folder has a `README.md` describing what belongs in it. Read it before
adding a file there.

**`src/lib/site.ts` is the single source of truth for the sitemap.** Navbar,
footer, page metadata, `sitemap.xml` and the route smoke tests all read from
it. Adding a public page means one entry there plus one `page.tsx` — a unit test
fails if those two ever disagree.

---

## 6. Sitemap

Six public pages with no per-record URLs, and one admin area. Five primary links
plus the Recruitment call to action, so the navbar still works at 360px. A unit
test fails if a dynamic `[param]` folder appears under `(site)`.

| Route                 | Nav     | Data it reads                                    | Built in |
| --------------------- | ------- | ------------------------------------------------ | -------- |
| `/`                   | primary | site info (Git)                                  | 2, 4     |
| `/about`              | primary | site info (Git) · team (Redis/R2)                | 4, 8     |
| `/events`             | primary | events (Redis/R2)                                | 7        |
| `/gallery`            | primary | event + club photos (store) · archive (Git)      | 7, D-039 |
| `/contact`            | primary | contact info (Git) · writes sponsorship requests | 4, 8     |
| `/recruitment`        | CTA     | domains (Git) · recruitment settings (Redis/R2)  | 4, 8     |
| `/admin`              | never   | dashboard                                        | 6        |
| `/admin/login`        | never   | —                                                | 6        |
| `/admin/events`       | never   | events                                           | 7        |
| `/admin/gallery`      | never   | standalone gallery photos                        | 7        |
| `/admin/team`         | never   | team members                                     | 8        |
| `/admin/recruitment`  | never   | recruitment settings                             | 8        |
| `/admin/sponsorships` | never   | sponsorship requests                             | 8        |

---

## 7. Data model (Stages 5–8)

Full field lists live in `src/lib/schemas/README.md`; keys, file paths and the
upload flow in `src/lib/data/README.md`; diagrams in `docs/ARCHITECTURE.md`.

| Entity                        | Stored in     | Edited at            | Cache tag                    | Public reader                     |
| ----------------------------- | ------------- | -------------------- | ---------------------------- | --------------------------------- |
| SiteInfo, Domain, ContactInfo | `src/content` | Git                  | — (build time)               | Home, About, Recruitment, Contact |
| Event (+ photos)              | Redis + R2    | `/admin/events`      | `events`                     | Events, Gallery                   |
| GalleryPhoto (standalone)     | Redis + R2    | `/admin/gallery`     | `gallery`                    | Gallery                           |
| TeamMember                    | Redis + R2    | `/admin/team`        | `team`                       | About                             |
| RecruitmentSettings           | Redis + R2    | `/admin/recruitment` | `recruitment`                | Recruitment, nav CTA              |
| SponsorshipRequest            | Redis         | `/contact` form      | — (admin only, never cached) | —                                 |

- **Event phases are derived, not stored:** _current_ = published and not yet
  ended; _awaiting timeline_ = ended but not on the timeline (admin-only, kept for
  later use); _timeline_ = `inTimeline`, which requires a past end; photos and a
  recap are optional (D-041). There is no manual ordering — the timeline is chronological.
- **The gallery has three sources** and shows them together, newest first,
  grouped by category: the photos of timeline events (category taken from the
  event), standalone `GalleryPhoto` records, and the club archive from Git
  (photos and short clips; shown even when no data store is reachable, D-039). Events and gallery photos share one
  `Category` enum, so the filters mean the same thing everywhere. The gallery page
  carries both the `events` and `gallery` cache tags.
- **Categories** are hackathon · competition · workshop · other (D-026).
- **Recruitment** opens with the Google Form link alone; the roles PDF is
  optional and the page says it is "coming soon" until uploaded (D-028).
  Domains stay visible whether it is open or not.
- **Team hierarchy**: `tier` is `core` (the office-bearers) or `secretary` (one
  per domain, with its `domainId`), then `order`. Coordinators and volunteers
  are not listed (D-027).

Redis keys and R2 files are namespaced by `DATA_NAMESPACE`, which **must differ
between production and preview** so preview deployments can never touch live
club data; a value that breaks that split is ignored with a warning (D-041). Every
write is one atomic Lua script, so indexes cannot drift. Updates carry an
`updatedAt` optimistic-concurrency check and reject stale edits with a clear
message rather than silently clobbering someone else's change (D-029).

---

## 8. Commands

```bash
pnpm dev           # dev server (Turbopack)
pnpm build         # production build — must pass before any stage-ending commit
pnpm start         # serve the production build
pnpm lint          # ESLint
pnpm lint:fix      # ESLint with --fix
pnpm typecheck     # next typegen && tsc --noEmit
pnpm format        # Prettier write
pnpm format:check  # Prettier check
pnpm test          # Vitest (unit)
pnpm test:live     # data layer against the real Upstash + R2 (needs .env.local)
pnpm test:e2e      # Playwright, Chromium + mobile WebKit (first run: pnpm exec playwright install chromium webkit)
pnpm test:deployed # the public specs against PLAYWRIGHT_BASE_URL (a deploy preview or production)
pnpm seed --demo   # labelled demo content in a dev namespace (never prod), D-031/D-032
pnpm data backups  # also: backup · sweep [--dry-run] · restore <date> [--yes] (D-034)
pnpm check         # lint + typecheck + test + build
pnpm check:launch  # fails while any contact detail is still a placeholder (go-live gate)
```

---

## 9. Environment variables

`.env.example` is the contract; copy it to `.env.local`. Every variable is
validated by `src/lib/env.ts` at startup.

Variables belonging to stages that are not built yet are **optional in the schema
but shape-checked** — a malformed URL fails immediately, while a missing one only
fails when the feature that needs it actually runs, via `requireEnv()`. That is
why `pnpm build` passes before the Upstash, R2 and Google accounts exist. Account
setup: `docs/SETUP_STORAGE.md`.

`src/lib/env.ts` is `server-only`: importing it from a Client Component is a build
error, so a secret cannot reach the browser by accident. Browser-safe values live
in `src/lib/env.public.ts`.

---

## 10. Build stages

One stage per session. `/clear` between stages. Commit and tag each stage
(`git tag stage-N`) so a bad stage can be rolled back cleanly.

| Stage | Scope                                                                        | Status                                         |
| ----- | ---------------------------------------------------------------------------- | ---------------------------------------------- |
| 1     | Foundation, architecture, project rules                                      | **Done**                                       |
| 2     | Animation system + AR/VR landing hero                                        | **Done**                                       |
| 3     | Design system + UI shell                                                     | **Done**                                       |
| 4     | Static content layer + page shells (Home, About, Recruitment, Contact) + SEO | **Done**                                       |
| 5     | Data layer: schemas, repository, browser uploads, cache tags                 | **Done**                                       |
| 6     | Admin authentication + panel shell + dashboard                               | **Done**                                       |
| 7     | Events and gallery (event photos + standalone photos) — admin ↔ public       | **Done**                                       |
| 8     | Team, recruitment and sponsorship requests — admin ↔ public                  | **Done**                                       |
| 9     | Animation polish, performance, accessibility, security headers               | **Done**                                       |
| 10    | Testing, deployment, nightly backup + orphan sweep, handover                 | **10a done** · 10b go-live (`docs/GO_LIVE.md`) |

The architecture was revised after Stage 1 (six-page sitemap, admin-managed
team, gallery derived from events, recruitment PDF). The Stage 1 scaffold was
updated to match; `docs/ARCHITECTURE.md` is the current design.

**Temporary scaffolding, to delete as it is replaced:**

- Placeholder credentials (admins `dryerisdry@gmail.com` and
  `mohan.arnav24@vit.edu` with a short `ADMIN_PASSWORD`, no Google keys, Netlify
  Blobs instead of Upstash/R2) — the swap list is at the top of
  `docs/OPEN_ITEMS.md`.
- Local data mode (`DATA_BACKEND=local`) and the `[Demo]` events, photos, team
  members and request from `pnpm seed --demo` — until the accounts and the real
  content exist (D-031, D-032).
- "Coming soon" contact placeholders — filled in `src/content/contact.json`;
  `pnpm check:launch` fails until they are (Stage 10 gate).

**Stage 10b (go-live)** swaps every placeholder above for the club's accounts,
in one sitting: `docs/GO_LIVE.md`. Coordinators use `docs/handbook/`.

---

## 11. Design decisions in force

The full reasoning is in [`docs/DECISIONS.md`](./docs/DECISIONS.md). What a
contributor must know before writing UI:

| Topic              | Decision                                                                                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero               | **Orbit Lab**: dark lab, low spectrum horizon, rings, one wireframe headset (D-001)                                                                             |
| Fonts              | **Space Grotesk** (display), **Inter** (body), **JetBrains Mono** (labels); via `next/font`, four files at most (D-002)                                         |
| Caption colour     | `text-subtle` is **`#797F8D`** (≥ 4.5:1 on bg, surface and raised); captions only (D-003)                                                                       |
| Palette            | The Style Board tokens; the spectrum is light, at most ~10% of any screen                                                                                       |
| Component source   | **React Bits only** (D-004); the events timeline is built in-house                                                                                              |
| Motion             | Rule 4 has no exceptions (D-009); TrueFocus is replaced by our own `FocusText`                                                                                  |
| WebGL              | One context in the hero, at most two heavy WebGL components per page; no `ogl` (D-010, D-011)                                                                   |
| Hero text          | The name is real text at first paint; the intro plays around it, skippable, once per session (D-010)                                                            |
| Navigation         | HUD rail on desktop (`HudNav`), aperture menu on mobile; no Dock (D-038, superseding D-012's PillNav/StaggeredMenu)                                             |
| Home               | Hero, mission/vision/about, domains; no team section (D-027). No stat counters in v1 (D-007)                                                                    |
| Contact            | One page: details and the sponsorship form (D-006)                                                                                                              |
| Sponsorship inbox  | Admin panel only; no email integration (D-008)                                                                                                                  |
| Repository         | Stays private while React Bits code is inside it (D-014)                                                                                                        |
| Colours            | Style Board palette is live in `globals.css` since Stage 2 (D-015); Stage 3 adds type, spacing, radii, shadows                                                  |
| Hero build         | MagicRings shader ported into the one R3F canvas (D-016); static still is token SVG (D-017); scroll-out pin (D-018)                                             |
| Motion tokens      | `--dur-*`, `--ease-*`, `--stagger`, `--motion-rise` in CSS; JS reads them via `readMotionTokens()` — never a literal                                            |
| Design tokens      | Type scale `text-display-*`/`text-body*`/`text-label`, `py-section`, `px-gutter`, `h-header`, `max-w-content`, `rounded-card`/`-control`, `shadow-card`/`-glow` |
| Shell              | Fixed header over the page; `data-full-bleed` sections run under it. HudNav (`lg`+) and the aperture MobileMenu (D-020, D-038)                                  |
| Logo               | Original badge + white-ring mark, raster via `next/image`; masters in `references/brand` (D-021)                                                                |
| Rule 4 and colour  | No colour/background transitions: hover colour is instant, overlays fade with opacity (D-022)                                                                   |
| Content            | Copy lives only in `src/content/*.json`, read through `src/lib/content.ts` (server-only); client components get props (D-023)                                   |
| QR codes           | Generated on the server from the stored link (`<QrCode>`); shown from `md` up, buttons on phones (D-023)                                                        |
| Placeholders       | Missing contact details are `null` → "Coming soon", never a fake link; no fake sponsorship form (D-024)                                                         |
| Contrast           | Every token pairing is audited for WCAG AA by `tests/unit/contrast.test.ts`; control borders use `--color-subtle`                                               |
| Hosting and files  | Netlify; Upstash Redis and Cloudflare R2 used directly; one `DATA_NAMESPACE` per environment (D-025)                                                            |
| Categories         | Hackathon · competition · workshop · other, shared by events and gallery photos (D-026)                                                                         |
| Team               | Core team, then one secretary per domain; About only (D-027)                                                                                                    |
| Recruitment PDF    | Optional: recruitment opens with the form link; "coming soon" until the PDF is uploaded (D-028)                                                                 |
| Data layer         | One generic repository over `RecordStore` + `ObjectStorage` ports; atomic Lua writes; public reads `'use cache'` (D-029)                                        |
| Admin access       | Google or password sign-in + allowlist re-checked per request; development sign-in locally only; three locks (D-030, D-039)                                     |
| Admin UI           | Reviewed shadcn subset on token aliases (no `accent`/`muted`); in-house toasts; `useUnsavedChanges` + `GuardedLink` (D-030)                                     |
| Local data         | `DATA_BACKEND=local`: records + uploads in `.data/`, same upload flow as R2; refused on Netlify (D-031)                                                         |
| Netlify Blobs      | `DATA_BACKEND=netlify-blobs`, default on Netlify without Upstash: CAS-on-etag JSON snapshots, files in ≤ 4 MiB parts through `/api/local-media` (D-039)         |
| Vercel             | Second host: `DATA_BACKEND=vercel-blob` runs the same Blobs adapters on a private Vercel Blob store; `VERCEL_ENV` maps onto the deploy guards (D-040)           |
| Images             | Any ratio: posters whole in a 4:5 frame, photos as square centre-cropped tiles, viewer shows them whole; WebP ≤ 2400 px (D-031)                                 |
| Admin-written text | Plain text as paragraphs (`<Paragraphs>`), never HTML; no Markdown renderer (D-031)                                                                             |
| Contact form       | Honeypot, Turnstile (fails closed on Netlify without keys), 3 requests/sender/hour in the data layer; no form where it cannot work (D-032)                      |
| Recruitment status | Admin-managed only (`recruitment.json` deleted); header button + mobile-menu tag show "open"; no site-wide banner (D-032)                                       |
| Overlay motion     | Admin sheet/dialogs enter and leave on keyframe tokens (`animate-fade-*`/`-rise-*`/`-slide-*`); `<Tilt>` on team cards (D-033)                                  |
| Public JavaScript  | Client components never import a schema module (it pulls in zod): pass constants as props, load validation on demand (D-033)                                    |
| Hero tiers         | Software-rendered WebGL (no GPU) gets the static still, like reduced motion (D-033)                                                                             |
| Security headers   | CSP + HSTS + framing/sniffing/referrer/permissions policies from `src/lib/security-headers.ts`; zero CSP violations is an e2e test (D-033)                      |
| Share images       | One per page at `/og/[page]`, prerendered; colours from `token-values.ts`, checked against globals.css (D-033)                                                  |
| Nightly job        | Backup (30 kept) then orphan sweep (24 h grace, refuses mass deletes); restore with `pnpm data`; Bearer `CRON_SECRET` (D-034)                                   |
| Public forms       | No react-hook-form default values on public forms: typing before hydration must survive (D-034)                                                                 |
| Admin form kit     | `FormField`/`CheckboxField`, `ImageField`/`PdfField`, `SaveBar`, `ConfirmDelete`, `useRecordVersion` — reuse, never copy (D-032)                                |
| Public reads       | Through `publicRead()` inside `<Suspense>`; a failure shows `<LoadFailed>`, never an error page (D-032)                                                         |
| Premium motion     | React Bits SplitText/ScrollReveal/SpotlightCard/ScrollVelocity/GlareHover rebuilt on rule 4; `SectionHeading` for every section; `Card spotlight` (D-037)       |
| Page openings      | `PageIntro` runs under the header over `LabBackdrop`; its title rises in CSS (`SplitText play="load"`), delays are `--stagger` multiples (D-037)                |
| Scroll triggers    | Starts/ends via `reachablePoint()` (clamped to max scroll), never a bare `'top 85%'` — nothing near a short page's end stays hidden (D-037)                     |
| XR HUD             | The site seen through the lab's headset: `HudCorners` lock-ons, `DecodeText` mono readouts, one scan, the page-change shutter, `Parallax` depth (D-038)         |
| Reticle            | Brackets lock onto what can be clicked; system cursor kept, mouse only, `aria-hidden`, never under reduced motion (D-038)                                       |
| Decoding text      | Mono labels only; the real text stays in the DOM, the glyphs play in an `aria-hidden` copy; once per trigger (D-038)                                            |
| Home rail / stack  | Domains ride a sticky horizontal rail from `md` (grid elsewhere); purpose panels stack (`stack:` variant); both off under reduced motion (D-038)                |
| Inner-page WebGL   | The Spectral Field behind `PageIntro`, high tier only, one context per page, still unless the visitor moves (D-038)                                             |
| Club archive       | `public/archive/` + `src/content/archive.json`: real photos and clips, a Git-managed third gallery source, read-only in the admin (D-039)                       |
| Clips              | Square poster tile + play badge; muted preview on mouse hover only; native `<video controls>` in the viewer; nothing autoplays (D-039)                          |
| Password sign-in   | `ADMIN_PASSWORD` (env only), constant-time, rate-limited, fingerprinted so a change signs everyone out; Setup card warns while weak (D-039)                     |
| Moments reel       | Home's CSS-3D cylinder of archive moments turns with the scroll (CircularGallery without `ogl`); a snap strip on phones and reduced motion (D-039)              |
| Forgiving settings | Env values are trimmed and unquoted; invalid or deploy-unsafe ones are dropped with a warning on the dashboard, never a failed site (D-041)                     |
| Proxy bundle       | `proxy.ts` decodes the session only (`auth/proxy-auth.ts`); a unit test fails if the data layer becomes reachable from it (D-041)                               |
| Event rules        | Registration link optional, published by default, timeline needs only a past end; one-click Put on timeline (D-041)                                             |
| Cropped images     | `coverSizes()` widens `sizes` by the photo's shape; gallery two columns on phones; Home reel only stills ≥ 960 px on the short side (D-041)                     |
| Campus map         | Contact embeds VIT Bibwewadi from `contact.json` with an Open in Google Maps button (D-041)                                                                     |
| Header and store   | The header is in the static shell; recruitment's "open" marks stream from a promise (`WhenRecruitmentOpen`), so the menu never waits for data (D-041)           |

---

## 12. Component registries and design tooling

`.mcp.json` registers the **shadcn MCP server**, and `components.json` configures
the shadcn CLI plus the one component registry the project uses. Both are committed
so every contributor gets the same tooling.

### Registries

| Registry           | Source                                | What it is                     |
| ------------------ | ------------------------------------- | ------------------------------ |
| shadcn (`@shadcn`) | built in                              | Admin-panel primitives         |
| `@react-bits`      | `https://reactbits.dev/r/{name}.json` | 200+ animated React components |

**No other registry is configured** (D-004). Aceternity UI and Magic UI are not used;
adding a source of vendored code needs a new entry in `docs/DECISIONS.md` first.

```bash
pnpm exec shadcn search @react-bits -q "scroll"   # browse
pnpm exec shadcn view @react-bits/StarBorder-TS-TW   # read the source before adding
pnpm exec shadcn add @react-bits/StarBorder-TS-TW --path src/components/motion
```

**Always pick the `-TS-TW` variant.** Every ReactBits component ships in four
flavours — `TS-TW`, `TS-CSS`, `JS-TW`, `JS-CSS`. This project is TypeScript +
Tailwind, so `-TS-TW` is the only correct one.

### Where components land

`components.json` points the `ui` alias at `src/components/admin/ui`, on purpose:
the locked stack says shadcn/ui is **admin only**, so `shadcn add button` cannot
silently leak into the public design system. ReactBits items are
`registry:component`, so pass `--path` explicitly:

| Kind                             | Destination               |
| -------------------------------- | ------------------------- |
| shadcn/ui primitive              | `src/components/admin/ui` |
| ReactBits motion/text effect     | `src/components/motion`   |
| ReactBits WebGL or 3D background | `src/components/three`    |

### Vendored code is a starting point, not a drop-in

`shadcn add` copies source into our repo; from that moment we own it and our
rules apply. Every ReactBits component must be **read** and reviewed against
sections 3 and 4 before it ships — the registry's dependency list is not
trustworthy on its own. Real examples:

- **TrueFocus** animates `filter: blur()` and the frame's `x`, `y`, `width` and
  `height`. Rule 4 forbids all of it, so we build `FocusText` instead.
- **ScrollReveal** animates `filter: blur()` and its cleanup calls
  `ScrollTrigger.getAll().forEach(t => t.kill())`, killing **every** ScrollTrigger
  on the page. Not used; our `<Reveal>` covers it.
- **Lanyard** lists no dependencies, but imports a physics engine and `meshline`
  and needs `card.glb` and `lanyard.png`, which `shadcn add` does not copy.
- **MagicRings** creates its own WebGL renderer, so it counts as its own context.
- **PillNav** depends on `react-router-dom`; it must be patched to `next/link` and
  `usePathname`.
- None handle `prefers-reduced-motion`; wrap or extend them.
- They carry raw Tailwind colour and size utilities; re-tokenize per rule 1.
- They register GSAP plugins at module scope, so they must be client components
  and should be dynamically imported where they are not above the fold.

The shortlist and the rejected list are in `docs/DECISIONS.md` (D-013). React Bits
is licensed **MIT + Commons Clause**: fine to use in the website, not to
redistribute; this is why the repository stays private (D-014).

### Dependency policy

React Bits' components split by what they need: GSAP, Motion, three/R3F and Lenis
(already in the stack), no dependencies, or something else.

**About a quarter depend on `ogl`**, a second WebGL library that is _not_ in the
locked stack. It is **not used** (D-011): the same moods are built in the R3F scene.
`vgpu`, `matter-js`, `gl-matrix`, `postprocessing`, `face-api.js` and
`@use-gesture/react` are likewise off the table unless a new decision says
otherwise.

### Figma MCP

The Figma MCP server is connected (account `Arnav`, **starter** tier). It works in
both directions — read a design into code, or push code into Figma — and is
skill-gated: several tools require loading their skill first.

| Need                               | Skill to load first      | Then call            |
| ---------------------------------- | ------------------------ | -------------------- |
| Implement a Figma design as code   | `figma-design-to-code`   | `get_design_context` |
| Implement animation from Figma     | `figma-implement-motion` | `get_motion_context` |
| Any write into a Figma file        | `figma-use`              | `use_figma`          |
| Build a design system inside Figma | `figma-generate-library` | `use_figma`          |
| Map Figma components to our code   | `figma-code-connect`     | Code Connect tools   |
| FigJam diagram                     | `figma-generate-diagram` | `generate_diagram`   |

Loading the skill is mandatory, not advisory — `get_design_context` and
`use_figma` fail in confusing ways without it. Read `skill://index.json` for the
current list.

Stage 3 was built from the Style Board and the reference boards without a Figma
file. If the club later produces one, read it with `figma-design-to-code` and
reconcile it against the tokens in `globals.css` rather than eyeballing
screenshots. Note that Code Connect and shared team
libraries may not be available on a starter seat; check before planning around
them.

---

## 13. Open inputs

Several decisions are still outstanding and block specific stages. They are
tracked in `docs/OPEN_ITEMS.md`. Check it before starting a stage; if an input is
missing, say so rather than inventing a placeholder that ships.
