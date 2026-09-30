# `src/components/admin`

Admin-panel components, built on shadcn/ui. shadcn/ui is used **here only** —
the public site uses the primitives in `src/components/ui`.

Planned building blocks:

- **Uploader** — compresses images to WebP in the browser, uploads straight to
  Blob with a token from `/api/admin/upload`, shows progress and retry, then
  hands the URLs to a Server Action. This folder is the one place outside
  `src/lib/data` allowed to import `@vercel/blob/client` (enforced by lint).
- **Event editor** — details, registration link and poster; for past events the
  recap, photos and the final "add to timeline" step. Its preview renders the
  _same_ public sections the site uses, so preview and production cannot drift.
- **Gallery manager** — bulk-upload standalone club photos with a category and alt
  text; lists standalone photos only (event photos are managed in the event editor).
- **Team editor** — name, position, photo, tier, core flag and ordering.
- **Recruitment panel** — open/closed toggle, roles PDF and Google Form link.
- **Sponsorship inbox** — list, detail and status.

Built in **Stage 6** (shell) and **Stages 7–8** (features).
