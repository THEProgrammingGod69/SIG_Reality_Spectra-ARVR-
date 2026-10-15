# Architecture — SIG Reality Spectra website

The current design of the site. `CLAUDE.md` holds the rules that follow from it;
`src/lib/schemas/README.md` and `src/lib/data/README.md` hold the field-level
detail. A printable proposal version with the same design is in
[`SIG_Reality_Spectra_Technical_Plan.pdf`](./SIG_Reality_Spectra_Technical_Plan.pdf);
if the two ever disagree, this file wins. Product and design decisions, with
their reasons, are in [`DECISIONS.md`](./DECISIONS.md).

---

## 1. What the site does

**Public side — six pages, no login**

| Page           | Content                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| `/` Home       | Hero (club name + one-line intro) · mission, vision and short "about us" · domains overview (no team, D-027)        |
| `/about`       | Club details · the core team, then the secretary of each domain (name, photo, position)                             |
| `/events`      | Current event on top (details + registration link) · timeline of past events with photos                            |
| `/gallery`     | Every photo — from timeline events and standalone club photos — filterable by category: hackathons, competitions, … |
| `/recruitment` | The club's domains, always visible · Google Form link while recruitment is open, plus the roles PDF once uploaded   |
| `/contact`     | Contact details · sponsorship/collaboration request form                                                            |

**Admin side — five tools, password or Google sign-in with an allowlist (D-039)**

| Page                  | Content                                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `/admin/events`       | Add the current event · complete ended events with a recap and photos · put them on the timeline · add past events directly |
| `/admin/gallery`      | Upload standalone club photos with a category and alt text; remove them. Event photos are managed in the event              |
| `/admin/team`         | Add, edit, reorder and remove members: the core team, and one secretary per domain                                          |
| `/admin/recruitment`  | Open/close recruitment · upload the roles PDF · set the Google Form link                                                    |
| `/admin/sponsorships` | Read requests sent from `/contact` and mark their status — the admin inbox is the only channel, there is no email           |

`/admin` is a dashboard (upcoming events, events awaiting the timeline, new
requests, recruitment status) and `/admin/login` is the sign-in page.

---

## 2. System overview

```mermaid
flowchart TB
  V["Visitors<br/>no login"] --> EDGE
  A["Admins<br/>2–3 allowlisted emails"] --> EDGE
  G["Maintainers<br/>edit src/content in Git"] -. push → build .-> EDGE

  EDGE["Netlify · CDN · HTTPS"]

  subgraph APP["Next.js 16 application (App Router, Cache Components)"]
    PUB["Public pages<br/>static shell + cached reads"]
    ADM["Admin pages<br/>dynamic, noindex"]
    PROXY["proxy.ts<br/>guards /admin/*"]
    SA["Server Actions<br/>session check · Zod · write · updateTag"]
    UP["/api/admin/upload<br/>issues presigned upload URLs"]
    CRON["/api/cron/nightly<br/>backup + orphan sweep"]
    CONTENT["src/content<br/>site info · domains · contact"]
  end

  EDGE --> PROXY --> ADM
  EDGE --> PUB
  ADM --> SA
  ADM --> UP
  PUB --> SA
  PUB -. build time .-> CONTENT

  REPO["Repository layer · src/lib/data<br/>the only code that touches Redis or R2"]
  SA --> REPO
  PUB --> REPO
  UP --> REPO
  CRON --> REPO

  REPO --> REDIS[("Upstash Redis<br/>events · gallery · team · recruitment · sponsorships")]
  REPO --> R2[("Cloudflare R2<br/>event, gallery and team photos · roles PDF · backups")]
  REPO -. "until Upstash/R2 exist (D-039)" .-> BLOBS[("Netlify Blobs<br/>the same records and files")]
  ADM -. direct PUT to a presigned URL .-> R2

  PUB -. verify .-> TURN["Cloudflare Turnstile"]
  ADM -. sign-in .-> OAUTH["Google OAuth"]
```

Public pages call Server Actions only for the sponsorship form. Every other
Server Action is admin-only and re-checks the session.

---

## 3. Where each piece of data lives

| Entity                        | Store         | Edited at            | Cache tag      | Read by                           |
| ----------------------------- | ------------- | -------------------- | -------------- | --------------------------------- |
| SiteInfo, Domain, ContactInfo | `src/content` | Git                  | — (build time) | Home, About, Recruitment, Contact |
| Event + EventPhoto            | Redis + R2    | `/admin/events`      | `events`       | Events, Gallery                   |
| GalleryPhoto (standalone)     | Redis + R2    | `/admin/gallery`     | `gallery`      | Gallery                           |
| TeamMember                    | Redis + R2    | `/admin/team`        | `team`         | About                             |
| RecruitmentSettings           | Redis + R2    | `/admin/recruitment` | `recruitment`  | Recruitment, nav call to action   |
| SponsorshipRequest            | Redis         | `/contact` form      | none           | `/admin/sponsorships` only        |

Recruitment status, the form link and the roles PDF are admin-managed only
(Stage 8, D-032): the interim `src/content/recruitment.json` is gone. Until an
admin first saves the settings, the site shows recruitment as closed.

Every stored record also carries `createdAt`, `updatedAt` (its version for
the stale-edit check) and `updatedBy`.

```mermaid
erDiagram
  EVENT ||--o{ EVENT_PHOTO : has
  EVENT {
    string id
    string title
    enum category
    string summary
    string description
    datetime startsAt
    datetime endsAt
    string venue
    enum mode
    string registrationUrl
    image poster
    bool published
    string recap
    bool inTimeline
  }
  EVENT_PHOTO {
    string url
    string alt
    int width
    int height
  }
  GALLERY_PHOTO {
    string id
    image image
    enum category
    string caption
  }
  TEAM_MEMBER {
    string id
    string name
    string position
    image photo
    enum tier
    string domainId
    int order
  }
  RECRUITMENT_SETTINGS {
    bool open
    string formUrl
    string rolesPdfUrl
  }
  SPONSORSHIP_REQUEST {
    string id
    string name
    string organisation
    string email
    enum type
    string message
    enum status
  }
```

The gallery page shows three sources together, grouped by category and newest
first: the photos of events on the timeline (category taken from the event),
standalone `GALLERY_PHOTO` records, and the club archive — photos and clips
committed in `public/archive/` and described by `src/content/archive.json`
(D-039), which shows even when no data store is reachable. Events and gallery photos share one `Category`
enum — hackathon, competition, workshop, other (D-026) — so the filters mean
the same thing for both. Standalone photos can grow without limit, so the page
renders the first batch and loads more on request, with blur placeholders and
stored dimensions so nothing shifts as images arrive.

---

## 4. Event lifecycle

An event's phase is **computed at request time from its dates and flags**. It is
never stored, so nothing has to run when a date passes.

```mermaid
stateDiagram-v2
  [*] --> Draft: admin adds event
  Draft --> Current: publish (registration link required)
  Current --> AwaitingTimeline: end date passes (automatic)
  AwaitingTimeline --> Timeline: admin adds recap + photos, then "add to timeline"
  [*] --> AwaitingTimeline: admin adds a past event directly
  Timeline --> AwaitingTimeline: admin removes it from the timeline
  Draft --> [*]: delete
  AwaitingTimeline --> [*]: delete (photos deleted too)
  Timeline --> [*]: delete (photos deleted too)
```

| Phase             | Visible on                            | Rule                                                |
| ----------------- | ------------------------------------- | --------------------------------------------------- |
| Draft             | admin                                 | not published, not ended                            |
| Current           | top of `/events`, admin               | published and not yet ended; soonest first          |
| Awaiting timeline | admin only ("kept for later")         | ended and not on the timeline                       |
| Timeline          | `/events` timeline, `/gallery`, admin | on the timeline — requires a past end and ≥ 1 photo |

An event without an end time ends at the end of its start day, India Standard
Time.

---

## 5. Caching and live updates

The project enables **Cache Components** (`cacheComponents: true`). Public reads
are cached functions; admin writes expire exactly the tags they touch.

```mermaid
sequenceDiagram
  participant Admin as Admin (browser)
  participant SA as Server Action
  participant Repo as Repository
  participant Redis as Upstash Redis
  participant Page as Public page

  Admin->>SA: save event
  SA->>SA: re-check session
  SA->>Repo: update(id, updatedAt, changes)
  Repo->>Repo: Zod parse · verify new files
  Repo->>Redis: one Lua script — check version, write record + index
  alt updatedAt is stale
    Repo-->>SA: conflict
    SA-->>Admin: "someone else changed this — reload"
  else saved
    Repo-->>SA: ok
    Repo->>SA: updateTag('events')
    SA-->>Admin: "Live on site"
    Page->>Repo: next visit — cached read has expired
    Repo->>Redis: fresh read
  end
```

| Page           | Rendering                                                              | Tags                |
| -------------- | ---------------------------------------------------------------------- | ------------------- |
| `/`            | fully static (Git content only)                                        | —                   |
| `/about`       | static shell · cached team (core, then secretaries)                    | `team`              |
| `/events`      | static shell · cached events · current/past split after `connection()` | `events`            |
| `/gallery`     | static shell · cached timeline photos + cached standalone photos       | `events`, `gallery` |
| `/recruitment` | static shell · cached settings                                         | `recruitment`       |
| `/contact`     | fully static · form posts to a Server Action                           | —                   |
| site layout    | navigation · recruitment status on the call to action                  | `recruitment`       |
| `/admin/*`     | dynamic per request, uncached reads, inside `<Suspense>`               | —                   |

Rules:

- **Nothing inside a `'use cache'` function reads the current time.** "Current"
  vs "past" is decided in the page after `await connection()`, so an event moves
  to the past exactly when its end passes, without any write.
- **`updateTag` is called only from Server Actions** — it cannot run in route
  handlers. That shapes the upload flow below.
- Public reads use `cacheLife('hours')`. Admin saves refresh them at once; the
  lifetime only bounds changes made outside the panel (the seed script).
- On Netlify, Cache Components and tag invalidation are supported by its
  Next.js runtime (D-025); confirmed on the first deploy with data
  (OPEN_ITEMS #26).

---

## 6. Uploads

Event photos, gallery photos, posters, team photos and the roles PDF never pass
through a Server Action: function request bodies are size-capped and an event or
the gallery can take dozens of photos at once.

```mermaid
sequenceDiagram
  participant UI as Admin uploader
  participant Tok as /api/admin/upload
  participant R2 as Cloudflare R2
  participant SA as Server Action
  participant Repo as Repository

  UI->>UI: new record? generate its id · compress image to WebP
  UI->>Tok: request upload (target, record id, type, size)
  Tok->>Tok: same-site? admin session? allowed type and size?
  Tok-->>UI: presigned PUT URL (5 min) under the record's folder
  UI->>R2: PUT file directly
  UI->>SA: attach URLs to record
  SA->>SA: re-check session
  SA->>Repo: save
  Repo->>R2: HEAD each new file — ours, this record, type, size (delete if not)
  Repo->>Repo: write · updateTag(...) · delete files no longer used
```

| Upload        | R2 key (under `{DATA_NAMESPACE}/`)    | Limits                                       |
| ------------- | ------------------------------------- | -------------------------------------------- |
| Event poster  | `events/{eventId}/poster/{rand}.webp` | image ≤ 5 MB, cropped to a fixed ratio       |
| Event photos  | `events/{eventId}/photos/{rand}.webp` | images ≤ 5 MB, ≤ 60 per event                |
| Gallery photo | `gallery/{photoId}/{rand}.webp`       | image ≤ 5 MB, alt text and category required |
| Team photo    | `team/{memberId}/{rand}.webp`         | image ≤ 5 MB, square crop                    |
| Roles PDF     | `recruitment/{rand}.pdf`              | PDF ≤ 10 MB                                  |
| Backups       | `backups/{yyyy-mm-dd}.json`           | written by the nightly job; 30 kept          |

For a **new** record the admin UI generates the record's id in the browser
before uploading, so the upload path is fixed before the file exists and the
save can check every URL against it. A presigned PUT cannot cap a file's size,
which is why the size and type are checked again on save.

Deleting a record deletes its files; replacing a file deletes the old one. Files
uploaded but never attached (a closed tab mid-upload) are removed by the nightly
orphan sweep, which treats every URL referenced by an event, gallery photo, team
member or the recruitment settings as live.

---

## 7. Security

| Layer          | Control                                                                                                                                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public surface | One nofollow footer link to `/admin/login` (D-039) · `noindex` on admin · `robots.txt` disallows `/admin` and `/api/` · CSP and security headers                                                               |
| Identity       | Password (`ADMIN_PASSWORD`, rate-limited) or Google sign-in via Auth.js · `ADMIN_EMAILS` allowlist, re-checked on every request · 8-hour JWT sessions · no user table · local-only development sign-in (D-030) |
| Route guard    | `proxy.ts` sends `/admin/*` without a session to `/admin/login`, returning only to `/admin` paths; the panel layout checks again                                                                               |
| Action guard   | Every admin Server Action runs inside `adminAction()`, which re-checks the session; the upload route checks it too (401) and refuses cross-site requests                                                       |
| Public form    | Honeypot · Cloudflare Turnstile (fails closed on Netlify without keys) · Zod · 3 requests per sender per hour, hashed address, in the data layer (D-032)                                                       |
| Data           | Zod on every write and read · stale-write rejection · server-only env module                                                                                                                                   |
| Scheduled job  | `/api/cron/nightly` accepts only `Authorization: Bearer $CRON_SECRET`                                                                                                                                          |

Sponsorship requests are stored and read in the admin panel only. There is no
email integration, so there is no mail provider account, sending domain or
delivery failure to handle; the dashboard shows a "new requests" count instead.

---

## 8. Environments

| Environment | `DATA_NAMESPACE` | Purpose                                                                                                    |
| ----------- | ---------------- | ---------------------------------------------------------------------------------------------------------- |
| Local       | `dev`            | development; `DATA_BACKEND=local` keeps it in `.data/` until Upstash/R2 exist; `pnpm seed --demo` fills it |
| Preview     | `preview`        | Netlify deploy previews and branch deploys                                                                 |
| Production  | `prod`           | club domain; nightly backup and orphan sweep                                                               |
| Live tests  | `test-…`         | throwaway, created and removed by `pnpm test:live`                                                         |

One Upstash database and one R2 bucket serve every environment; the namespace
prefixes every Redis key (`sig:{ns}:…`) and R2 object (`{ns}/…`). Netlify
sets `CONTEXT` on each build, and the build fails if production is not
`prod` or a preview is.

---

## 9. What changed in this revision

Removed as redundant with the new scope:

- Pages: Projects, Achievements, Resources, Join (now **Recruitment**), Team
  (merged into **About**), Collaborate (merged into **Contact**).
- Detail routes: `/projects/[slug]`, `/events/[slug]`, `/gallery/[album]`.
- Event slugs and manual event ordering — the timeline is chronological.
- Sponsor brochure, CSV export and acknowledgement emails to submitters.
- Admin "Enquiries" (now **Sponsorships**).

Added:

- Admin-managed **team members** with photos and hierarchy tier.
- **Past-event photos**, the timeline step, and the **gallery derived from them**.
- **Recruitment PDF** alongside the Google Form link, with domains always visible.
- `cacheComponents` enabled, which `cacheTag` requires.
- Browser-direct uploads with a token route, and a nightly orphan sweep.
- `CRON_SECRET` for the nightly job.

---

## 10. Revision 3 — decisions after the team review

Recorded in [`DECISIONS.md`](./DECISIONS.md):

- **Gallery has two sources.** New `GalleryPhoto` entity, `gallery` cache tag,
  shared `Category` enum, `/admin/gallery` (a fifth admin tool), and its own
  file path.
- **No email.** Resend and its three environment variables are removed;
  sponsorship requests live in the admin inbox.
- **One WebGL context in the hero, no `ogl`, no rule-4 exceptions.** These are
  constraints on the Stage 2 build rather than changes to this architecture.

## 11. Revision 4 — Stage 5 on Netlify

Recorded in [`DECISIONS.md`](./DECISIONS.md) D-025 – D-029:

- **Hosting is Netlify**; files moved from Vercel Blob to **Cloudflare R2**
  (presigned browser uploads); Upstash is used directly; the nightly job will
  run from a Netlify scheduled function.
- **`DATA_NAMESPACE`** replaces `REDIS_KEY_PREFIX` and covers R2 too.
- **Categories** are hackathon, competition, workshop, other.
- **Team** is the core team plus one secretary per domain, on About only; the
  home page has no team section and the `isCore` flag is gone.
- **Recruitment** opens with the form link alone; the roles PDF is optional.
- **Writes** are one atomic Lua script per save instead of MULTI/EXEC, and the
  data layer is one generic repository over two storage ports.

## 12. Revision 5 — Stage 6, admin access

Recorded in [`DECISIONS.md`](./DECISIONS.md) D-030:

- Built with **placeholder credentials**: Google sign-in switches on when its
  keys are set; until then a **development sign-in** works on a developer's
  machine only. Temporary admin: `dryerisdry@gmail.com`.
- The panel lives under `src/app/admin/(panel)`; `/admin/login` is outside it.
- Admin Server Actions return an `ActionResult` through `adminAction()`.
- The dashboard reads the data store per request and lists which outside
  services still lack credentials.

## 13. Revision 6 — Stage 7, events and gallery

Recorded in [`DECISIONS.md`](./DECISIONS.md) D-031:

- **Local data mode** (`DATA_BACKEND=local`) stands in for Upstash and R2 on a
  developer's computer: a JSON file of records and a folder of files in
  `.data/`, with the same signed-upload flow through `/api/local-media`.
  Refused on Netlify.
- **/admin/events** (list by phase, editor for new and existing events, recap,
  photos, timeline) and **/admin/gallery** (batch upload, edit, delete), built
  on react-hook-form with the one schema per entity.
- **/events** shows current events (posters whole in a 4:5 frame, register
  link) and the timeline; **/gallery** shows both photo sources with category
  filters, "show more" and a full-size viewer.
- Images of any ratio; descriptions and recaps are plain text.
- Content is placeholder (`[Demo]`) until the club supplies events and photos.

## 14. Revision 7 — Stage 8, team, recruitment and sponsorships

Recorded in [`DECISIONS.md`](./DECISIONS.md) D-032:

- **/admin/team** (core team then secretaries, editor with photo, core-team
  reorder) feeds **About**: square photos or initials, the secretary's domain.
- **/admin/recruitment** (open/closed, form link, roles PDF) feeds
  **/recruitment**, the header's Recruitment button and the mobile menu. The
  interim `src/content/recruitment.json` is gone; an unsaved store means
  closed.
- **The sponsorship form on /contact** sends to **/admin/sponsorships** (inbox
  newest first, status, delete). Spam checks, in order: honeypot, Turnstile
  (fails closed on Netlify without keys), validation, then 3 requests per
  sender per hour — a counter on the `RecordStore` port (`hit()`), keyed by a
  hash of the address. Where the form cannot work, Contact lists the channels.
- Public reads go through `publicRead()` and show `<LoadFailed>` on an outage.
- Content is placeholder (`[Demo]` members, the form link) until the club
  supplies the team, the roles PDF and the Turnstile keys.

## 15. Revision 8 — Stage 9, polish and hardening

Recorded in [`DECISIONS.md`](./DECISIONS.md) D-033:

- **Security headers** on every response (`src/lib/security-headers.ts` via
  `headers()` in next.config.ts): CSP limited to the site, Turnstile, the
  analytics beacon, R2 uploads and a Maps embed; HSTS, no framing, `nosniff`,
  referrer and permissions policies; `X-Robots-Tag: noindex` on /admin and /api.
- **Analytics**: Cloudflare Web Analytics, cookieless, public site only,
  switched on by `NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN`.
- **Share images**: `/og/[page]`, one per public page, prerendered at build.
  /events also carries schema.org Event data for its current events.
- **Performance**: no schema module (and so no zod) in public client code; the
  page fade is CSS; image `sizes` match the grids; software WebGL gets the
  static hero.
- **Accessibility**: axe-core (WCAG 2.2 AA) on every page and key state, in
  the e2e suite.

## 16. Revision 9 — Stage 10a, operations and handover

Recorded in [`DECISIONS.md`](./DECISIONS.md) D-034:

- **Nightly job**: a Netlify scheduled function calls `POST /api/cron/nightly`
  (Bearer `CRON_SECRET`) at 02:30 India time. It backs up every record to
  `{ns}/backups/{date}.json` (30 kept), then deletes uploads no record mentions
  once they are a day old, refusing anything that looks like a mass deletion.
- **Restore** and manual runs: `pnpm data` (backups, backup, sweep, restore),
  through `src/lib/data/maintenance.ts` on the same ports as the app.
- **Testing**: mobile WebKit beside Chromium; `pnpm test:deployed` for a
  deploy preview or production.
- **Handover**: `docs/handbook/` for coordinators; `docs/GO_LIVE.md` for
  Stage 10b.

## 17. Revision 10 — the club archive, password sign-in, Netlify Blobs

Recorded in [`DECISIONS.md`](./DECISIONS.md) D-039:

- **Club archive**: a third gallery source in Git (`public/archive/`,
  `src/content/archive.json`, validated at build), with clips: poster tiles,
  hover preview, native player; filters animate with GSAP Flip. Home shows it
  in "Moments from the lab", a CSS-3D reel.
- **Password sign-in**: an Auth.js Credentials provider for the allowlist,
  `ADMIN_PASSWORD` in env only, constant-time, rate-limited in the data layer,
  fingerprinted so changing it ends every password session.
- **Footer link**: one `nofollow` "Admin" link to `/admin/login` in the footer;
  admin routes stay `noindex` and disallowed.
- **Netlify Blobs backend**: `DATA_BACKEND=netlify-blobs`, the default on
  Netlify without Upstash. Records are one JSON snapshot per collection,
  written with compare-and-swap on the etag; files are served through
  `/api/local-media` and uploaded in ≤ 4 MiB parts.
