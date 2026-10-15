# SIG Reality Spectra

Official website of **SIG Reality Spectra**, the AR/VR/XR special interest group
at VIT Pune.

A public site the club can update without a developer: events and their photos,
team members, recruitment and sponsorship requests are managed from `/admin` and
go live immediately, with no redeploy. The little copy that rarely changes (intro,
mission, vision, domains, contact details) is edited as JSON in Git.

> **Contributors: read [`CLAUDE.md`](./CLAUDE.md) first.** It holds the product
> context, the locked tech stack and the rules this codebase is built on. The
> design, with diagrams, is in [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

---

## Setup

Requires **Node.js 22.12+** (this repo is developed on 24 — see `.nvmrc`) and
**pnpm 10**.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open <http://localhost:3000>. The admin panel is at `/admin` (the footer's
small "Admin" link): with `AUTH_SECRET`, `ADMIN_EMAILS` and `ADMIN_PASSWORD`
set, sign in with an allowlisted email and the password; `pnpm dev` also offers
a development sign-in ([`docs/SETUP_AUTH.md`](./docs/SETUP_AUTH.md)).

`.env.local` can stay mostly blank for now. Every variable belongs to the stage
that introduces it, and the app only fails when a feature that needs one actually
runs. See the comments in `.env.example`; the data accounts (Upstash Redis,
Cloudflare R2) are set up with [`docs/SETUP_STORAGE.md`](./docs/SETUP_STORAGE.md).

To run the end-to-end tests once, install the browsers first (desktop Chromium
and the mobile WebKit that stands in for iPhone Safari):

```bash
pnpm exec playwright install chromium webkit
```

Without the data accounts, set `DATA_BACKEND="local"` in `.env.local` to keep
records and uploads in `.data/`, and `pnpm seed --demo` to fill it with sample
content ([`docs/SETUP_STORAGE.md`](./docs/SETUP_STORAGE.md)).

---

## Scripts

| Command              | What it does                                                     |
| -------------------- | ---------------------------------------------------------------- |
| `pnpm dev`           | Dev server (Turbopack)                                           |
| `pnpm build`         | Production build                                                 |
| `pnpm start`         | Serve the production build                                       |
| `pnpm lint`          | ESLint                                                           |
| `pnpm lint:fix`      | ESLint with `--fix`                                              |
| `pnpm typecheck`     | `next typegen` then `tsc --noEmit`                               |
| `pnpm format`        | Prettier, write                                                  |
| `pnpm format:check`  | Prettier, check only                                             |
| `pnpm test`          | Vitest unit tests                                                |
| `pnpm test:live`     | Data layer tests against the real Redis and R2                   |
| `pnpm test:e2e`      | Playwright end-to-end tests (Chromium + mobile WebKit)           |
| `pnpm test:deployed` | The public tests against `PLAYWRIGHT_BASE_URL` (a deployed site) |
| `pnpm check`         | lint + typecheck + test + build, in that order                   |
| `pnpm check:launch`  | Fails while a contact detail is a placeholder                    |
| `pnpm seed --demo`   | Labelled sample content (never in production)                    |
| `pnpm data …`        | Backups, the orphan sweep, restore (`docs/handbook/backups.md`)  |

---

## Project layout

```
src/app/(site)/     public pages, one folder per sitemap route
src/app/admin/      admin panel (noindex; one nofollow footer link)
src/components/     ui / motion / three / sections / admin
src/lib/            data repository, Zod schemas, auth, env, site config
src/content/        site info, domains, contact details
tests/unit/         Vitest
tests/e2e/          Playwright
scripts/            seed (demo content) and data (backup, sweep, restore)
netlify/functions/  the nightly scheduled job
references/         design and animation inputs — never shipped
docs/               architecture, decisions, setup guides; handbook/ for coordinators
```

Every folder has a `README.md` explaining what belongs in it.

`src/lib/site.ts` is the single source of truth for the sitemap: the navbar,
footer, page metadata and the route smoke tests all read from it.

---

## Sitemap

| Public page    | Shows                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| `/`            | Hero, mission / vision / about, domains                                   |
| `/about`       | Club details; the core team, then the secretary of each domain            |
| `/events`      | Current event with registration link, timeline of past events with photos |
| `/gallery`     | Event photos, club photos and the club archive (with clips), by category  |
| `/recruitment` | Domains always; roles PDF and Google Form only while recruitment is open  |
| `/contact`     | Contact details and the sponsorship request form                          |

**Admin** — `/admin` (dashboard), `/admin/login`, `/admin/events`, `/admin/gallery`,
`/admin/team`, `/admin/recruitment`, `/admin/sponsorships`. Reached from one nofollow footer link (D-039).

There are no per-record URLs: events, photos and team members render inline on
their list pages.

---

## Build stages

The site is built in ten stages, one per session, each tagged in Git
(`stage-1`, `stage-2`, …) so any stage can be rolled back cleanly.

| Stage | Scope                                                                        | Status       |
| ----- | ---------------------------------------------------------------------------- | ------------ |
| 1     | Foundation, architecture, project rules                                      | **Done**     |
| 2     | Animation system + AR/VR landing hero                                        | **Done**     |
| 3     | Design system + UI shell                                                     | **Done**     |
| 4     | Static content layer + page shells (Home, About, Recruitment, Contact) + SEO | **Done**     |
| 5     | Data layer: schemas, repository, browser uploads, cache tags                 | **Done**     |
| 6     | Admin authentication + panel shell + dashboard                               | **Done**     |
| 7     | Events and gallery — admin ↔ public                                          | **Done**     |
| 8     | Team, recruitment and sponsorship requests — admin ↔ public                  | **Done**     |
| 9     | Animation polish, performance, accessibility, security headers               | **Done**     |
| 10    | Testing, deployment, nightly backup + orphan sweep, handover                 | **10a done** |

Stage 10b is the go-live on the club's own accounts:
[`docs/GO_LIVE.md`](./docs/GO_LIVE.md). Coordinators keep the site up to date
with the [admin handbook](./docs/handbook/README.md). Inputs still needed from
the club are tracked in
[`docs/OPEN_ITEMS.md`](./docs/OPEN_ITEMS.md), and the reasoning behind design and
product choices in [`docs/DECISIONS.md`](./docs/DECISIONS.md).

---

## Tech stack

Next.js 16 (App Router) · TypeScript strict · Tailwind CSS v4 · React Three Fiber
· GSAP + ScrollTrigger · Motion · Lenis · Upstash Redis · Cloudflare R2 (or Netlify
Blobs) · Zod ·
Auth.js · react-hook-form · Cloudflare Turnstile · Cloudflare Web Analytics ·
Playwright · axe-core · Vitest ·
deployed on Netlify.
