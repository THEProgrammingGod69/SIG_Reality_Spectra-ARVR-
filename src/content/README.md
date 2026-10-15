# `src/content` — Git-edited content

The small amount of copy that changes rarely and needs no admin panel. Every file
is validated against a Zod schema (`src/lib/schemas/content.ts`, and
`archive.ts` for the archive) **at build time**: a malformed field fails
`pnpm build` with a message naming the file and the field.

| File           | Holds                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| `site.json`    | Hero one-liner, motto, positioning line (meta description), mission, vision, about                   |
| `domains.json` | The ten domains, in display order (01–10), each `technical` or `non-technical`                       |
| `contact.json` | Email, phone, address, map link/embed, social channels (and which get a QR code)                     |
| `archive.json` | The club archive in the gallery: each photo or clip in `public/archive/`, with alt, caption, date, … |

`archive.json` entries: `src` (`/archive/<folder>/<name>.webp`, or `.mp4` for a
clip) · `kind` (`photo` or `video`) · `poster` (a clip's still, required for
`video`) · `width` and `height` (of the photo, or of the clip and its poster) ·
`duration` (a clip's seconds) · `category` (the gallery's categories, D-026) ·
`album` (optional: the event or series) · `date` (ISO, with offset) · `alt` ·
`caption` (≤ 120) · `credit` (optional: the photographer, as their watermark
reads). `pnpm test` checks every file exists and every photo's size matches.
Give a replaced file a new name: `public/` is not fingerprinted.

How to edit:

- Keep the club's approved wording (content brief, Oct 2026). The name is not
  here: it lives in `src/lib/site.ts` as "SIG Reality Spectra" and never changes.
- A detail that is not known yet is `null` — never "TODO" or a dummy link. The
  Contact page shows "Coming soon" for it, and `pnpm check:launch` lists it.
- Links must be `https://`. QR codes are generated from the `href`, so changing
  a link changes its QR code too.
- Read the files through `src/lib/content.ts`, never by importing the JSON in a
  component (tests are the exception).

Everything the committee changes week to week — events, event photos, club
photos, team members, recruitment settings and sponsorship requests — is
**not** here. It lives in the data store (Netlify Blobs, or Upstash Redis and
Cloudflare R2; `src/lib/data/README.md`) and is edited at `/admin` (D-025). The
archive is the exception: past media that never changes, kept in Git (which is
also its backup); `/admin/gallery` lists it read-only.
