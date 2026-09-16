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

Requires **Node.js 20.9+** (this repo is developed on 24 — see `.nvmrc`) and
**pnpm 10**.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open <http://localhost:3000>.

`.env.local` can stay mostly blank for now. Every variable belongs to the stage
that introduces it, and the app only fails when a feature that needs one actually
runs. See the comments in `.env.example`.

To run the end-to-end tests once, install the browser first:

```bash
pnpm exec playwright install chromium
```

---

## Scripts

| Command             | What it does                                   |
| ------------------- | ---------------------------------------------- |
| `pnpm dev`          | Dev server (Turbopack)                         |
| `pnpm build`        | Production build                               |
| `pnpm start`        | Serve the production build                     |
| `pnpm lint`         | ESLint                                         |
| `pnpm lint:fix`     | ESLint with `--fix`                            |
| `pnpm typecheck`    | `next typegen` then `tsc --noEmit`             |
| `pnpm format`       | Prettier, write                                |
| `pnpm format:check` | Prettier, check only                           |
| `pnpm test`         | Vitest unit tests                              |
| `pnpm test:e2e`     | Playwright end-to-end tests                    |
| `pnpm check`        | lint + typecheck + test + build, in that order |

---

## Project layout

```
src/app/(site)/     public pages, one folder per sitemap route
src/app/admin/      admin panel (noindex, never linked from the public site)
src/components/     ui / motion / three / sections / admin
src/lib/            data repository, Zod schemas, auth, env, site config
src/content/        site info, domains, contact details (Stage 4)
tests/unit/         Vitest
tests/e2e/          Playwright
references/         design and animation inputs — never shipped
docs/               handover documentation
```

Every folder has a `README.md` explaining what belongs in it.

`src/lib/site.ts` is the single source of truth for the sitemap: the navbar,
footer, page metadata and the route smoke tests all read from it.

---

## Sitemap

| Public page    | Shows                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| `/`            | Hero, mission / vision / about, core team                                 |
| `/about`       | Club details and every team member by hierarchy                           |
| `/events`      | Current event with registration link, timeline of past events with photos |
| `/gallery`     | Past-event photos by category (workshops, hackathons, meetups, …)         |
| `/recruitment` | Domains always; roles PDF and Google Form only while recruitment is open  |
| `/contact`     | Contact details and the sponsorship request form                          |

**Admin** — `/admin` (dashboard), `/admin/login`, `/admin/events`, `/admin/team`,
`/admin/recruitment`, `/admin/sponsorships`. Never linked from the public site.

There are no per-record URLs: events, photos and team members render inline on
their list pages.

---

## Build stages

The site is built in ten stages, one per session, each tagged in Git
(`stage-1`, `stage-2`, …) so any stage can be rolled back cleanly.

| Stage | Scope                                                                        | Status      |
| ----- | ---------------------------------------------------------------------------- | ----------- |
| 1     | Foundation, architecture, project rules                                      | **Done**    |
| 2     | Animation system + AR/VR landing hero                                        | Not started |
| 3     | Design system + UI shell                                                     | Not started |
| 4     | Static content layer + page shells (Home, About, Recruitment, Contact) + SEO | Not started |
| 5     | Data layer: schemas, repository, browser uploads, cache tags                 | Not started |
| 6     | Admin authentication + panel shell + dashboard                               | Not started |
| 7     | Events and gallery — admin ↔ public                                          | Not started |
| 8     | Team, recruitment and sponsorship requests — admin ↔ public                  | Not started |
| 9     | Animation polish, performance, accessibility, security headers               | Not started |
| 10    | Testing, deployment, nightly backup + orphan sweep, handover                 | Not started |

Every page currently renders a placeholder that names the stage which fills it
in. Inputs still needed from the club are tracked in
[`docs/OPEN_ITEMS.md`](./docs/OPEN_ITEMS.md).

---

## Tech stack

Next.js 16 (App Router) · TypeScript strict · Tailwind CSS v4 · React Three Fiber
· GSAP + ScrollTrigger · Motion · Lenis · Upstash Redis · Vercel Blob · Zod ·
Auth.js · react-hook-form · Resend · Cloudflare Turnstile · Playwright · Vitest ·
deployed on Vercel.
