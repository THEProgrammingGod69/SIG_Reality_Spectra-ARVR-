# `src/components/admin`

Admin-panel components, built on shadcn/ui. shadcn/ui is used **here only** —
the public site uses the primitives in `src/components/ui`.

Planned building blocks:

- **Uploader** — generates a new record's id, compresses images to WebP in the
  browser, asks `/api/admin/upload` for a presigned URL and PUTs the file
  straight to R2 with plain `fetch` (no storage client), shows progress and
  retry, then hands the URLs to a Server Action. Contract and limits:
  `src/lib/schemas/upload.ts`; flow: `src/lib/data/README.md`.
- **Event editor** — details, registration link and poster; for past events the
  recap, photos and the final "add to timeline" step. Its preview renders the
  _same_ public sections the site uses, so preview and production cannot drift.
- **Gallery manager** — bulk-upload standalone club photos with a category and alt
  text; lists standalone photos only (event photos are managed in the event editor).
- **Team editor** — name, position, photo, tier (core or secretary), the
  secretary's domain, and ordering (D-027).
- **Recruitment panel** — open/closed toggle, roles PDF and Google Form link.
- **Sponsorship inbox** — list, detail and status.

Built in **Stage 6** (shell) and **Stages 7–8** (features).
