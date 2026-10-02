# `src/lib/data` — repository layer

**The only code in this project allowed to import `@upstash/redis` or
`aws4fetch`** (the R2 request signer). A `no-restricted-imports` ESLint rule
enforces it, so breaking it fails `pnpm lint`. The app imports from
`@/lib/data` (`index.ts`) and nothing deeper.

Design: D-025 (Netlify, Upstash, R2) and D-029 (this layer).

| File                      | Responsibility                                                                                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`                | The front door: cached public reads (`getPublicEvents`, `getGallery`, `getTeam`, `getRecruitment`) and `repositories()` for admin reads and writes |
| `runtime.ts`              | Builds the real services from the environment; shared by the app and `scripts/seed.mts`                                                            |
| `entity.ts`               | The generic repository: validation on write and read, versions, files, cache tags                                                                  |
| `events.ts`               | Events, `listPublic`, `splitByPhase` (current / timeline at request time)                                                                          |
| `gallery.ts`              | Standalone photos, `buildGallery` (event photos + club photos, newest first)                                                                       |
| `team.ts`                 | Team members, `reorder`, `groupTeam` (core, then secretaries by domain)                                                                            |
| `recruitment.ts`          | The one settings record: `get`, `getStatus` (closed by default), `save`                                                                            |
| `sponsorships.ts`         | Requests from /contact: `submit`, `list` (newest first, paged), `setStatus`, `remove`                                                              |
| `media.ts`                | Upload tickets, attach checks, deletes                                                                                                             |
| `keys.ts`                 | Every Redis key and storage key, from `DATA_NAMESPACE`                                                                                             |
| `tags.ts`                 | Cache tag names shared by reads and writes                                                                                                         |
| `errors.ts`               | Errors with admin-facing messages (not found, conflict, invalid, media)                                                                            |
| `adapters/types.ts`       | The two ports: `RecordStore` and `ObjectStorage`                                                                                                   |
| `adapters/redis-store.ts` | `RecordStore` on Upstash (atomic writes by Lua script)                                                                                             |
| `adapters/r2-storage.ts`  | `ObjectStorage` on Cloudflare R2                                                                                                                   |
| `adapters/memory-*.ts`    | In-memory versions of both ports, for the unit tests                                                                                               |

## Reads and writes

```ts
// A public page (server component):
const { current, timeline } = await getPublicEvents(); // inside <Suspense>

// A Server Action (Stage 6+), after checking the session itself (rule 8):
const event = await repositories().events.update(id, expectedUpdatedAt, changes, session.email);
```

- **Public reads** are `'use cache'` + `cacheTag` + `cacheLife('hours')` and
  never read the current time. `getPublicEvents()` splits current from
  timeline **after** `connection()`, outside the cache (rule 12), so render it
  inside `<Suspense>`. Public results never carry `updatedBy`.
- **Writes** call `updateTag` for their entity's tags (rule 10), which Next.js
  allows only in Server Actions. Admin reads are never cached.
- **Errors** an admin can act on are `DataError`s; show their message. An
  `InvalidDataError` also lists `issues` per field for the form.

| Entity              | Collection    | Tags                            | Files (`UPLOAD_TARGETS`)      |
| ------------------- | ------------- | ------------------------------- | ----------------------------- |
| Event               | `event`       | `events` (the gallery too)      | `event-poster`, `event-photo` |
| GalleryPhoto        | `gallery`     | `gallery`                       | `gallery-photo`               |
| TeamMember          | `member`      | `team`                          | `member-photo`                |
| RecruitmentSettings | `settings`    | `recruitment`                   | `roles-pdf`                   |
| SponsorshipRequest  | `sponsorship` | none (admin only, never cached) | none                          |

## Redis keys

| Key                           | Type       | Holds                                     |
| ----------------------------- | ---------- | ----------------------------------------- |
| `sig:{ns}:{collection}:{id}`  | hash       | `data` (the record's JSON) and `version`  |
| `sig:{ns}:{collection}:index` | sorted set | the collection's ids, scored for ordering |
| `sig:{ns}:ratelimit:*`        | —          | the contact form's rate limiter (Stage 8) |

`{ns}` is `DATA_NAMESPACE`: `prod`, `preview`, `dev`, or `test-…` for the live
tests. Index scores: events by start time, gallery photos and sponsorship
requests by creation time, team members by tier then order.

## Files (R2)

| Key                                        | Contents                   |
| ------------------------------------------ | -------------------------- |
| `{ns}/events/{eventId}/poster/{rand}.webp` | event poster               |
| `{ns}/events/{eventId}/photos/{rand}.webp` | event photos               |
| `{ns}/gallery/{photoId}/{rand}.webp`       | standalone gallery photo   |
| `{ns}/team/{memberId}/{rand}.webp`         | team member photo          |
| `{ns}/recruitment/{rand}.pdf`              | roles and responsibilities |
| `{ns}/backups/{yyyy-mm-dd}.json`           | nightly backup (Stage 10)  |

Images may also be `.jpg`, `.png` or `.avif` when the browser could not
convert them; limits are in `src/lib/schemas/upload.ts` (images 5 MB, PDF
10 MB).

## Uploads (rule 11)

Files never pass through a Server Action or any function: request bodies are
size-capped, and an event can take dozens of photos at once.

1. The admin UI generates the record's id (`crypto.randomUUID()`) for a new
   record and compresses images to WebP in the browser.
2. It POSTs an `UploadRequest` to `/api/admin/upload`, which re-checks the
   session (rule 8) and returns an `UploadTicket`: a presigned PUT URL valid
   for five minutes, under the record's folder.
3. The browser PUTs the file straight to R2 with the ticket's headers.
4. The UI calls a Server Action with the resulting URLs. Saving the record
   verifies every newly attached URL — ours, this namespace, this record and
   field, uploaded, an allowed type, within the limit — and deletes an upload
   that fails. Then it saves and calls `updateTag`.

Files a record stops using (a replaced poster, a removed photo, a deleted
record) are deleted after the record is saved. A failed delete is logged and
left to the nightly orphan sweep (Stage 10), which also removes uploads that
were never attached.

## Rules

- Validate with Zod on every write **and** every read. A corrupt record is
  logged and skipped, never allowed to crash a public page.
- Every write is one atomic Lua script: it checks each record's version, then
  writes records and indexes together, so indexes cannot drift.
- Updates and deletes carry the `updatedAt` the admin's form was loaded with
  and fail with a `ConflictError` ("changed by someone else") if it moved.
- Nothing in a cached function reads the current time.
- A new storage backend implements `RecordStore` or `ObjectStorage` and passes
  the contract tests in `tests/unit/data`; nothing above the ports changes.

## Tests and tools

- `pnpm test` — schemas, repositories and media on the in-memory adapters.
- `pnpm test:live` — the same store contract plus a full create → update →
  delete cycle against the real Upstash and R2, in a throwaway namespace;
  checks that no key or file is left behind.
- `pnpm seed [--demo]` — copies `src/content/recruitment.json` into Redis if
  no admin has saved recruitment settings; `--demo` adds labelled sample
  records (never in `prod`).

Built in **Stage 5**.
