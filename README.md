# SIG Reality Spectra

Official website of **SIG Reality Spectra**, the AR/VR/XR special interest group
at VIT Pune.

A public site the club can update without a developer: events, recruitment and
sponsor enquiries are managed from `/admin` and go live immediately, with no
redeploy. Everything else is edited as JSON/MDX in Git.

> **Contributors: read [`CLAUDE.md`](./CLAUDE.md) first.** It holds the product
> context, the locked tech stack and the rules this codebase is built on.

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
src/content/        Git-edited content (Stage 4)
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

**Public** — `/`, `/about`, `/projects`, `/events`, `/team`, `/join`,
`/achievements`, `/gallery`, `/resources`, `/collaborate`, `/contact`

**Detail templates** — `/projects/[slug]`, `/events/[slug]`, `/gallery/[album]`

**Admin** — `/admin`, `/admin/login`, `/admin/events`, `/admin/recruitment`,
`/admin/enquiries`

Navigation is deliberately shallow: five primary links plus a Join Us call to
action, with the rest in the footer, so the navbar works at 360px.

---

## Build stages

The site is built in ten stages, one per session, each tagged in Git
(`stage-1`, `stage-2`, …) so any stage can be rolled back cleanly.

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

Every page currently renders a placeholder that names the stage which fills it
in. Inputs still needed from the club are tracked in
[`docs/OPEN_ITEMS.md`](./docs/OPEN_ITEMS.md).

---

## Tech stack

Next.js 16 (App Router) · TypeScript strict · Tailwind CSS v4 · React Three Fiber
· GSAP + ScrollTrigger · Motion · Lenis · Upstash Redis · Vercel Blob · Zod ·
Auth.js · react-hook-form · Resend · Cloudflare Turnstile · Playwright · Vitest ·
deployed on Vercel.
