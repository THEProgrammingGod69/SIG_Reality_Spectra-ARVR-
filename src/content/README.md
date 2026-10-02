# `src/content` — Git-edited content

The small amount of copy that changes rarely and needs no admin panel. Every file
is validated against a Zod schema (`src/lib/schemas/content.ts`) **at build time**:
a malformed field fails `pnpm build` with a message naming the file and the field.

| File               | Holds                                                                              |
| ------------------ | ---------------------------------------------------------------------------------- |
| `site.json`        | Hero one-liner, motto, positioning line (meta description), mission, vision, about |
| `domains.json`     | The ten domains, in display order (01–10), each `technical` or `non-technical`     |
| `contact.json`     | Email, phone, address, map link/embed, social channels (and which get a QR code)   |
| `recruitment.json` | **Interim** recruitment status and Google Form link — replaced in Stage 8 (D-024)  |

How to edit:

- Keep the club's approved wording (content brief, Oct 2026). The name is not
  here: it lives in `src/lib/site.ts` as "SIG Reality Spectra" and never changes.
- A detail that is not known yet is `null` — never "TODO" or a dummy link. The
  Contact page shows "Coming soon" for it, and `pnpm check:launch` lists it.
- Links must be `https://`. QR codes are generated from the `href`, so changing
  a link changes its QR code too.
- Read the files through `src/lib/content.ts`, never by importing the JSON in a
  component (tests are the exception).

Everything the committee changes week to week — events, event photos, team
members, recruitment settings (from Stage 8) and sponsorship requests — is
**not** here. It lives in Redis and Blob and is edited at `/admin`.
