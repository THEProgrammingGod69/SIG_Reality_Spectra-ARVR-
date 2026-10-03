# CLAUDE.md — SIG Reality Spectra website

Read this file first, in every session, before writing any code.

It is the contract for this project: what we are building, what is already
decided, and the rules that do not get renegotiated stage by stage.

---

## 1. Product context

The official website of **SIG Reality Spectra**, the AR/VR/XR special interest
group at **VIT Pune**.

**Public visitors never log in.** Six public pages:

| Page           | Shows                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| `/` Home       | Hero (name + one-line intro) · mission, vision and short "about us" · domains overview (no team, D-027)     |
| `/about`       | Club details · the core team, then the secretary of each domain (name, photo, position), D-027              |
| `/events`      | Current event on top (details + registration link) · timeline of past events with photos                    |
| `/gallery`     | All photos — event photos and standalone club photos — filterable by category (hackathons, competitions, …) |
| `/recruitment` | The club's domains, always · roles PDF and Google Form link, **only while recruitment is open**             |
| `/contact`     | Contact details · sponsorship/collaboration request form (goes to the admin panel)                          |

**Admins** (2–3 allowlisted Google accounts) sign in at `/admin` to manage five
things:

| Admin page            | Does                                                                                                                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/admin/events`       | Add the current event (details + registration link). Once it ends it is kept for later; the admin adds a recap and photos and puts it on the timeline. Past events can also be added directly. |
| `/admin/gallery`      | Upload standalone club photos with a category. Photos of timeline events reach the gallery automatically.                                                                                      |
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
  hosting marketplace, so they move with the club, not with the host.
- **The gallery has two sources.** The photos of timeline events (uploaded once,
  in the event) and standalone club photos (uploaded in `/admin/gallery`), shown
  together and grouped by one shared category list.
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

| Layer              | Choice                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------- |
| Framework          | Next.js 16 (App Router) + TypeScript strict                                                  |
| Package manager    | pnpm                                                                                         |
| Styling            | Tailwind CSS v4 + shadcn/ui (**admin only**); `cn()` = clsx + tailwind-merge (D-019)         |
| Icons              | lucide-react, 1.5 stroke, via `<Icon>` (D-019)                                               |
| 3D                 | React Three Fiber + `@react-three/drei`                                                      |
| Scroll/timeline    | GSAP + ScrollTrigger                                                                         |
| UI micro-animation | Motion (formerly Framer Motion)                                                              |
| Smooth scroll      | Lenis                                                                                        |
| Data               | Upstash Redis (serverless KV, created directly on upstash.com — D-025)                       |
| Files              | Cloudflare R2 (S3-compatible), signed with `aws4fetch` — D-025                               |
| Validation         | Zod (shared schemas)                                                                         |
| Admin auth         | Auth.js (`next-auth@5.0.0-beta.32`, pinned) — Google, JWT sessions, allowlist in env (D-030) |
| Forms              | react-hook-form + Zod                                                                        |
| Spam protection    | Cloudflare Turnstile + honeypot                                                              |
| Analytics          | Chosen in Stage 9 (Vercel Analytics does not run on Netlify — D-025)                         |
| Testing            | Playwright (E2E) + Vitest (schemas/utils)                                                    |
| Hosting            | Netlify + club-owned GitHub org (D-025)                                                      |

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

6. **The public site links to `/admin` from nowhere.** No login link, no footer
   link. Admins navigate there directly. An e2e test enforces this.

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

This project runs **Next.js 16.3.5**. Several APIs changed from 14/15. Check
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
    api/local-media/ local data mode only: receives and serves uploads (Stage 7)
    api/cron/nightly backup + orphan sweep, CRON_SECRET  (Stage 10)
    globals.css      design tokens live here, in @theme
    robots.ts
  components/
    ui/              design-system primitives          (Stage 3)
    site/            site chrome: header, PillNav, mobile menu, footer   (Stage 3)
    motion/          reusable animation primitives     (Stage 2)
    three/           R3F scenes                        (Stage 2)
    sections/        composed page sections            (Stage 2/4)
    admin/           admin shell, toasts, unsaved-changes guard; ui/ = reviewed shadcn (Stages 6–8)
  lib/
    data/            repository layer — ONLY place that touches Redis/R2      (Stage 5)
    schemas/         Zod schemas: one per entity, shared by forms and data   (Stage 5)
    auth/            Auth.js config, access policy, session checks, adminAction()   (Stage 6)
    action-result.ts the one result shape admin Server Actions return     (Stage 6)
    integrations.ts  which outside services have credentials (dashboard)  (Stage 6)
    dates.ts         dates in the club's time zone                        (Stage 6)
    motion/          motion tokens reader, GSAP setup, hero device tiers (Stage 2)
    cn.ts            the one class-name helper (public UI and shadcn admin)
    contrast.ts      WCAG contrast maths for the token audit and /dev/ui
    env.ts           server env, validated with Zod (server-only)
    env.public.ts    NEXT_PUBLIC_* env, safe in the browser
    site.ts          sitemap, nav and structural club constants — single source of truth
    content.ts       the validated src/content files (server-only)          (Stage 4)
    metadata.ts      pageMetadata(): title, canonical, OpenGraph per page   (Stage 4)
    structured-data.ts  schema.org JSON-LD for the club                     (Stage 4)
  assets/            imported static assets (brand logo images)        (Stage 3)
  content/           site, domains, contact, interim recruitment — JSON, validated at build time
  proxy.ts           the /admin guard (Next 16's renamed middleware)       (Stage 6)
scripts/             seed.mts — pnpm seed [--demo]                            (Stage 5)
.data/               local data mode records + uploads, gitignored (D-031)  (Stage 7)
tests/
  unit/              Vitest — schemas, utilities, data layer on in-memory adapters
  e2e/               Playwright
references/          design + animation inputs, never shipped
docs/                handover documentation
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
| `/gallery`            | primary | timeline event photos + club photos (Redis/R2)   | 7        |
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
  later use); _timeline_ = `inTimeline`, which requires a past end and at least
  one photo. There is no manual ordering — the timeline is chronological.
- **The gallery has two sources** and shows them together, newest first, grouped
  by category: the photos of timeline events (category taken from the event) and
  standalone `GalleryPhoto` records. Events and gallery photos share one
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
club data; on Netlify the build enforces `prod` for production only. Every
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
pnpm test:e2e      # Playwright (first run: pnpm exec playwright install chromium)
pnpm seed          # copy recruitment.json into Redis if unset; --demo adds sample data
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

| Stage | Scope                                                                        | Status      |
| ----- | ---------------------------------------------------------------------------- | ----------- |
| 1     | Foundation, architecture, project rules                                      | **Done**    |
| 2     | Animation system + AR/VR landing hero                                        | **Done**    |
| 3     | Design system + UI shell                                                     | **Done**    |
| 4     | Static content layer + page shells (Home, About, Recruitment, Contact) + SEO | **Done**    |
| 5     | Data layer: schemas, repository, browser uploads, cache tags                 | **Done**    |
| 6     | Admin authentication + panel shell + dashboard                               | **Done**    |
| 7     | Events and gallery (event photos + standalone photos) — admin ↔ public       | **Done**    |
| 8     | Team, recruitment and sponsorship requests — admin ↔ public                  | Not started |
| 9     | Animation polish, performance, accessibility, security headers               | Not started |
| 10    | Testing, deployment, nightly backup + orphan sweep, handover                 | Not started |

The architecture was revised after Stage 1 (six-page sitemap, admin-managed
team, gallery derived from events, recruitment PDF). The Stage 1 scaffold was
updated to match; `docs/ARCHITECTURE.md` is the current design.

**Temporary scaffolding, to delete as it is replaced:**

- `src/content/recruitment.json` — replaced by the admin-managed
  RecruitmentSettings in Stage 8 (D-024); it is already validated by that
  record's schema (D-028), and `pnpm seed` copies it into Redis.
- `PlannedTool` in `src/components/admin/admin-page.tsx` — the Team,
  Recruitment and Sponsorships pages' "Built in Stage 8" state.
- Placeholder credentials (temporary admin `dryerisdry@gmail.com`, no Google
  keys, no Upstash/R2) — the swap list is at the top of `docs/OPEN_ITEMS.md`.
- Local data mode (`DATA_BACKEND=local`) and the `[Demo]` events and photos from
  `pnpm seed --demo` — until the accounts and the real content exist (D-031).
- `src/components/sections/sponsorship-notice.tsx` — replaced by the
  sponsorship request form in Stage 8 (D-024).
- The empty state in `src/components/sections/team-section.tsx` — Stage 8 passes
  the team members in.
- "Coming soon" contact placeholders — filled in `src/content/contact.json`;
  `pnpm check:launch` fails until they are (Stage 10 gate).

**Deliberately not built yet, so a later stage owns it cleanly:**

- `api/cron/nightly` and its Netlify scheduled function — Stage 10.

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
| Navigation         | PillNav on desktop (patched to `next/link`), StaggeredMenu on mobile; no Dock (D-012)                                                                           |
| Home               | Hero, mission/vision/about, domains; no team section (D-027). No stat counters in v1 (D-007)                                                                    |
| Contact            | One page: details and the sponsorship form (D-006)                                                                                                              |
| Sponsorship inbox  | Admin panel only; no email integration (D-008)                                                                                                                  |
| Repository         | Stays private while React Bits code is inside it (D-014)                                                                                                        |
| Colours            | Style Board palette is live in `globals.css` since Stage 2 (D-015); Stage 3 adds type, spacing, radii, shadows                                                  |
| Hero build         | MagicRings shader ported into the one R3F canvas (D-016); static still is token SVG (D-017); scroll-out pin (D-018)                                             |
| Motion tokens      | `--dur-*`, `--ease-*`, `--stagger`, `--motion-rise` in CSS; JS reads them via `readMotionTokens()` — never a literal                                            |
| Design tokens      | Type scale `text-display-*`/`text-body*`/`text-label`, `py-section`, `px-gutter`, `h-header`, `max-w-content`, `rounded-card`/`-control`, `shadow-card`/`-glow` |
| Shell              | Fixed header over the page; `data-full-bleed` sections run under it. PillNav (`lg`+) and MobileMenu rebuilt from React Bits (D-020)                             |
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
| Admin access       | Google sign-in + allowlist re-checked per request; development sign-in locally only; three locks (D-030)                                                        |
| Admin UI           | Reviewed shadcn subset on token aliases (no `accent`/`muted`); in-house toasts; `useUnsavedChanges` + `GuardedLink` (D-030)                                     |
| Local data         | `DATA_BACKEND=local`: records + uploads in `.data/`, same upload flow as R2; refused on Netlify (D-031)                                                         |
| Images             | Any ratio: posters whole in a 4:5 frame, photos as square centre-cropped tiles, viewer shows them whole; WebP ≤ 2400 px (D-031)                                 |
| Admin-written text | Plain text as paragraphs (`<Paragraphs>`), never HTML; no Markdown renderer (D-031)                                                                             |

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
