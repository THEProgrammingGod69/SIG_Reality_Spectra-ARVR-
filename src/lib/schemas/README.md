# `src/lib/schemas` — Zod schemas

One schema per editable entity, and that single schema is used by the admin
form, the Server Action, the stored record and every public read (rule 3).
There is never a second, slightly different copy of a field's rules. Nothing
here is server-only: the admin forms validate in the browser with the same
schemas.

| File             | Schemas                                                     | Edited via           | Stage |
| ---------------- | ----------------------------------------------------------- | -------------------- | ----- |
| `fields.ts`      | Shared field rules; `entitySchemas()` builds input + record | —                    | 5     |
| `content.ts`     | SiteInfo, Domain, ContactInfo                               | Git (`src/content`)  | 4     |
| `category.ts`    | Category (shared enum)                                      | —                    | 5     |
| `image.ts`       | Image (url, alt, width, height)                             | —                    | 5     |
| `upload.ts`      | UploadRequest, upload targets, folders and limits           | —                    | 5     |
| `event.ts`       | Event; phases (`eventPhase`, `eventEndsAt`)                 | `/admin/events`      | 5     |
| `gallery.ts`     | GalleryPhoto                                                | `/admin/gallery`     | 5     |
| `team.ts`        | TeamMember, tiers                                           | `/admin/team`        | 5     |
| `recruitment.ts` | RecruitmentSettings (also validates `recruitment.json`)     | `/admin/recruitment` | 5     |
| `sponsorship.ts` | SponsorshipRequest, SponsorshipForm                         | `/contact` form      | 5     |

## Input and record

Every admin-managed entity has two schemas from one field list
(`entitySchemas()`):

- **`XInputSchema`** — the editable fields: what the form and the Server
  Action validate. Defaults fill optional fields.
- **`XSchema`** — the stored record: the input plus `createdAt`, `updatedAt`
  (also the version for the "changed by someone else" check) and `updatedBy`.

Cross-field rules are written once and apply to both. Rules that need the
current time or other data (an event can join the timeline only after it
ends; a secretary's domain must exist) are checked by the data layer.

## Fields

**Category** — `hackathon` · `competition` · `workshop` · `other` (D-026),
shared by events **and** standalone gallery photos so the gallery filters mean
the same thing everywhere.

**Image** — url (https) · alt (3–200, required) · width · height (measured in
the browser). That the URL is ours and belongs to the record is checked when
the record is saved (`src/lib/data/media.ts`).

**Event** — id (UUID) · title (3–80) · category · summary (20–160) ·
description (plain text, blank line = new paragraph, ≤ 5000) · startsAt · endsAt (optional, after start) ·
venue · mode (`offline` · `online` · `hybrid`) · registrationUrl (https;
required when published) · poster · published · recap (≤ 2000) · photos (≤ 60,
no duplicates) · inTimeline (needs ≥ 1 photo).

An event's phase is **derived at request time, never stored** (rule 12):

| Phase      | Rule                               | Shown on                       |
| ---------- | ---------------------------------- | ------------------------------ |
| `draft`    | not ended, not published           | admin only                     |
| `current`  | not ended, published               | top of `/events`               |
| `awaiting` | ended, not on the timeline         | admin only — kept for later    |
| `timeline` | on the timeline (ended, ≥ 1 photo) | `/events` timeline, `/gallery` |

Without `endsAt`, an event ends at the end of its start day in India Standard
Time.

**GalleryPhoto** (standalone) — id · image · category · caption (≤ 120,
optional). The public gallery shows these together with the photos of timeline
events (which take the event's category), newest first.

**TeamMember** — id · name (2–60) · position (2–60) · tier (`core` ·
`secretary`, D-027) · domainId (required for a secretary, from
`domains.json`; null otherwise) · photo (optional; initials without one) ·
order (within the tier).

**RecruitmentSettings** — open · formUrl (https; required to open) ·
rolesPdfUrl (optional; the page says "coming soon" without it, D-028). The
input shape is also `src/content/recruitment.json`'s. Closed by default before
an admin saves.

**SponsorshipRequest** — id (assigned by the server) · name · organisation ·
email · phone (optional) · type (`sponsorship` · `collaboration` · `other`) ·
message (20–2000) · status (`new` · `contacted` · `closed`, admin-only).
`SponsorshipFormSchema` is what the public form may send.

Valid and invalid cases for each live in `tests/unit/schemas.test.ts`.
