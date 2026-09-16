# CLAUDE.md — SIG Reality Spectra website

Read this file first, in every session, before writing any code.

It is the contract for this project: what we are building, what is already
decided, and the rules that do not get renegotiated stage by stage.

---

## 1. Product context

The official website of **SIG Reality Spectra**, the AR/VR/XR special interest
group at **VIT Pune**.

- **Public visitors never log in.** The public site is mostly static.
- **Events:** the public sees events; the "Register" button redirects to the
  official **VIERP** registration link stored per event. Past events show
  "Event concluded" instead of the button.
- **Recruitment:** an admin toggles recruitment on/off and sets a Google Form
  URL. When on, the Join Us page and a site-wide banner link to that form.
- **Sponsors** submit a collaboration/sponsor enquiry form.
- **Admins** (2–3 allowlisted Google accounts) sign in at `/admin` to:
  create/edit/delete/reorder events, toggle recruitment and set the form URL,
  and read sponsor enquiries.
- **Admin changes must appear on the live site immediately after save, with NO
  redeploy.** This is the single hardest constraint in the project and it drives
  the entire data and caching design.
- **No traditional database.** Data lives in Upstash Redis (JSON records) and
  Vercel Blob (images), behind a repository layer so Postgres can replace Redis
  later without touching a single UI file.
- **Handover matters.** The club committee changes every year. A coordinator who
  has never seen the code must be able to add an event from a written guide, and
  admin access must transfer by editing one environment variable.

### Audience and tone

Aesthetic brief from the club: _cinematic, realistic XR lab — not gaming neon_.
Professional, dark, mobile-first. When reviewing a page, ask: does this look like
a lab that builds real things, or a gaming landing page?

---

## 2. Locked tech stack — do not substitute

| Layer              | Choice                                                          |
| ------------------ | --------------------------------------------------------------- |
| Framework          | Next.js 16 (App Router) + TypeScript strict                     |
| Package manager    | pnpm                                                            |
| Styling            | Tailwind CSS v4 + shadcn/ui (**admin only**)                    |
| 3D                 | React Three Fiber + `@react-three/drei`                         |
| Scroll/timeline    | GSAP + ScrollTrigger                                            |
| UI micro-animation | Motion (formerly Framer Motion)                                 |
| Smooth scroll      | Lenis                                                           |
| Data               | Upstash Redis (serverless KV, via Vercel Marketplace)           |
| Images             | Vercel Blob                                                     |
| Validation         | Zod (shared schemas)                                            |
| Admin auth         | Auth.js — Google provider, JWT sessions, email allowlist in env |
| Forms              | react-hook-form + Zod                                           |
| Email              | Resend                                                          |
| Spam protection    | Cloudflare Turnstile + honeypot                                 |
| Analytics          | Vercel Analytics                                                |
| Testing            | Playwright (E2E) + Vitest (schemas/utils)                       |
| Hosting            | Vercel + club-owned GitHub org                                  |

If a library looks like a better fit mid-build, raise it — do not silently swap it.

---

## 3. Permanent rules

These are not style preferences. Breaking one is a bug.

1. **Never hardcode colours, spacing, fonts or durations. Use design tokens.**
   Tokens live in `src/app/globals.css` under `@theme`. Changing one token value
   must change the whole site. No raw hex or magic px inside a component.

2. **All data access goes through `src/lib/data`.** UI never imports the Redis or
   Blob client directly. This is enforced by a `no-restricted-imports` ESLint
   rule, so violating it fails `pnpm lint`.

3. **One Zod schema per admin-editable entity**, used by the admin form, the
   server action and the public renderer. Never a second, slightly different copy
   of a field's rules. Validate on every write _and_ every read.

4. **Animate only `transform` and `opacity`. Respect `prefers-reduced-motion`
   everywhere.** Every motion primitive degrades to a simple fade, or to nothing.

5. **Every stage ends with `pnpm lint`, `pnpm typecheck` and `pnpm build`
   passing** — plus `pnpm test` and `pnpm test:e2e`. `pnpm check` runs the lot.

### Rules that follow from the product

6. **The public site links to `/admin` from nowhere.** No login link, no footer
   link. Admins navigate there directly. An e2e test enforces this.

7. **Every admin route is `noindex, nofollow`** and disallowed in `robots.txt`.

8. **Never trust the proxy alone.** `proxy.ts` guards `/admin/*`, _and_ every
   server action re-checks the session itself.

9. **Nothing an admin does may make the public site look broken.** Cards use
   fixed aspect ratios, titles are line-clamped, grids use `auto-fill minmax`,
   and every list has an empty state. Layouts must survive 0, 1, 3 and 40 items,
   and a 400-character title.

10. **A write that does not revalidate its cache tags is an incomplete write.**

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
- **`cacheLife` and `cacheTag` are stable** — no `unstable_` prefix.
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
    admin/           admin routes (noindex, never linked publicly)
    globals.css      design tokens live here, in @theme
    robots.ts
  components/
    ui/              design-system primitives          (Stage 3)
    motion/          reusable animation primitives     (Stage 2)
    three/           R3F scenes                        (Stage 2)
    sections/        composed page sections            (Stage 2/4)
    admin/           admin components, shadcn/ui       (Stage 6/7)
  lib/
    data/            repository layer — ONLY place that touches Redis/Blob
    schemas/         Zod schemas
    auth/            Auth.js config
    env.ts           server env, validated with Zod (server-only)
    env.public.ts    NEXT_PUBLIC_* env, safe in the browser
    site.ts          sitemap, nav and club config — single source of truth
  content/           Git-edited content (JSON/MDX), validated at build time
tests/
  unit/              Vitest — schemas and pure utilities
  e2e/               Playwright
references/          design + animation inputs, never shipped
docs/                handover documentation
```

Each folder has a `README.md` describing what belongs in it. Read it before
adding a file there.

**`src/lib/site.ts` is the single source of truth for the sitemap.** Navbar,
footer, placeholder pages, `sitemap.xml` and the route smoke tests all read from
it. Adding a public page means one entry there plus one `page.tsx` — a unit test
fails if those two ever disagree.

---

## 6. Sitemap

Eleven public pages, three detail templates, one admin area. Navigation is
deliberately shallow — five primary links plus one call to action — so the navbar
still works at 360px.

| Route              | Nav     | Built in |
| ------------------ | ------- | -------- |
| `/`                | primary | 2 / 4    |
| `/about`           | primary | 4        |
| `/projects`        | primary | 4        |
| `/events`          | primary | 7        |
| `/team`            | primary | 4        |
| `/join`            | CTA     | 8        |
| `/achievements`    | footer  | 4        |
| `/gallery`         | footer  | 4        |
| `/resources`       | footer  | 4        |
| `/collaborate`     | footer  | 8        |
| `/contact`         | footer  | 4        |
| `/projects/[slug]` | —       | 4        |
| `/events/[slug]`   | —       | 7        |
| `/gallery/[album]` | —       | 4        |
| `/admin/*`         | never   | 6–8      |

---

## 7. Data model (Stages 5–8)

Redis keys are namespaced by `REDIS_KEY_PREFIX`, which **must differ between
production and preview** so preview deployments can never touch live club data.

- `event:{id}` — one JSON record per event
- a sorted set for display order, and a `slug → id` index
- `settings` — recruitment toggle, Google Form URL, banner text
- `enquiry:{id}` — sponsor and collaboration enquiries

Multi-key writes use transactions so indexes cannot drift. Updates carry an
`updatedAt` optimistic-concurrency check and reject stale edits with a clear
message rather than silently clobbering someone else's change.

Cache tags: `events`, `event:{slug}`, `settings`. Every write calls a revalidation
helper — see the `updateTag` note in section 4.

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
pnpm test:e2e      # Playwright (first run: pnpm exec playwright install chromium)
pnpm check         # lint + typecheck + test + build
```

---

## 9. Environment variables

`.env.example` is the contract; copy it to `.env.local`. Every variable is
validated by `src/lib/env.ts` at startup.

Variables belonging to stages that are not built yet are **optional in the schema
but shape-checked** — a malformed URL fails immediately, while a missing one only
fails when the feature that needs it actually runs, via `requireEnv()`. That is
why `pnpm build` passes before the Upstash, Google and Resend accounts exist.

`src/lib/env.ts` is `server-only`: importing it from a Client Component is a build
error, so a secret cannot reach the browser by accident. Browser-safe values live
in `src/lib/env.public.ts`.

---

## 10. Build stages

One stage per session. `/clear` between stages. Commit and tag each stage
(`git tag stage-N`) so a bad stage can be rolled back cleanly.

| Stage | Scope                                             | Status      |
| ----- | ------------------------------------------------- | ----------- |
| 1     | Foundation, architecture, project rules           | **Done**    |
| 2     | Animation system + AR/VR landing hero             | Not started |
| 3     | Design system + UI style                          | Not started |
| 4     | Static pages + typed content layer                | Not started |
| 5     | Data layer (Redis + Blob) + schemas               | Not started |
| 6     | Admin authentication + panel shell                | Not started |
| 7     | Events management, admin ↔ public                 | Not started |
| 8     | Recruitment toggle + sponsor enquiries            | Not started |
| 9     | Animation polish, performance, accessibility, SEO | Not started |
| 10    | Testing, deployment, handover                     | Not started |

**Temporary scaffolding, to delete as it is replaced:**

- `src/components/ui/page-placeholder.tsx` — delete once every route has content.
- The nav and footer in `src/app/(site)/layout.tsx` — replaced in Stage 3.
- The admin shell in `src/app/admin/layout.tsx` — replaced in Stage 6.
- The neutral token _values_ in `globals.css` — values replaced in Stage 3, names kept.

**Deliberately not built yet, so a later stage owns it cleanly:**

- `sitemap.ts` — Stage 4, because it must include published event slugs read
  through the repository layer.
- `proxy.ts` — Stage 6, together with authentication.

---

## 11. Open inputs

Several decisions are still outstanding and block specific stages. They are
tracked in `docs/OPEN_ITEMS.md`. Check it before starting a stage; if an input is
missing, say so rather than inventing a placeholder that ships.
