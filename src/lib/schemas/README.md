# `src/lib/schemas` — Zod schemas

One schema per editable entity, and that single schema is used by the admin
form, the Server Action and the public renderer. There is never a second,
slightly different copy of a field's rules.

| File             | Schemas                       | Edited via           | Stage |
| ---------------- | ----------------------------- | -------------------- | ----- |
| `content.ts`     | SiteInfo, Domain, ContactInfo | Git (`src/content`)  | 4     |
| `event.ts`       | Event, EventPhoto             | `/admin/events`      | 5     |
| `team.ts`        | TeamMember                    | `/admin/team`        | 5     |
| `recruitment.ts` | RecruitmentSettings           | `/admin/recruitment` | 5     |
| `sponsorship.ts` | SponsorshipRequest            | `/contact` form      | 5     |

## Planned fields

**Event** — id · title (3–80) · category (`workshop` · `hackathon` · `meetup` ·
`talk` · `competition` · `other`) · summary (20–160) · description (markdown,
≤ 5000) · startsAt · endsAt (optional, after start) · venue · mode (`offline` ·
`online` · `hybrid`) · registrationUrl (https) · poster + alt text · published ·
recap (≤ 2000) · photos (≤ 60, each with url, alt, width, height) · inTimeline ·
createdAt · updatedAt · updatedBy.

An event's phase is **derived at request time, never stored**:

| Phase             | Rule                                                     | Shown on                        |
| ----------------- | -------------------------------------------------------- | ------------------------------- |
| Current           | published and not yet ended                              | top of `/events`                |
| Awaiting timeline | ended and not in the timeline                            | admin only — kept for later use |
| Timeline          | `inTimeline` (requires an end in the past and ≥ 1 photo) | `/events` timeline, `/gallery`  |

A published current event must have a registration link. The gallery is built
from the photos of timeline events, grouped by event category.

**TeamMember** — id · name · position · photo + alt text · tier (hierarchy level)
· isCore (also shown on the home page) · order within tier · updatedAt.

**RecruitmentSettings** — open · formUrl (https) · rolesPdfUrl · updatedAt ·
updatedBy. Both links are required to open recruitment, so the public page can
never show a missing link. Returns safe defaults (closed) when no record exists.

**SponsorshipRequest** — id · name · organisation · email · phone (optional) ·
type (`sponsorship` · `collaboration` · `other`) · message (20–2000) · status
(`new` · `contacted` · `closed`) · createdAt.

Export the inferred TypeScript types alongside each schema, and cover valid and
invalid cases with Vitest tests.
