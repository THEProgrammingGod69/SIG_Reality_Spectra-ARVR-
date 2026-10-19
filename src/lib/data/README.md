# `src/lib/data` — repository layer

**The only code in this project allowed to import `@upstash/redis`,
`aws4fetch`** (the R2 request signer) **or `@netlify/blobs`**. A `no-restricted-imports` ESLint rule
enforces it, so breaking it fails `pnpm lint`. The app imports from
`@/lib/data` (`index.ts`) and nothing deeper; the one exception is
`errors.ts`, plain classes that `src/lib/action-result.ts` reads on the client.

Design: D-025 (Netlify, Upstash, R2) and D-029 (this layer).

## Backends

`DATA_BACKEND` picks one; nothing above the two ports (`adapters/types.ts`)
knows which.

| `DATA_BACKEND`  | Records                           | Files                                                         | Where                                                   |
| --------------- | --------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------- |
| `netlify-blobs` | Netlify Blobs store `sig-records` | Netlify Blobs store `sig-media`, served by `/api/local-media` | Netlify; the default there when no Upstash URL is set   |
| `upstash`       | Upstash Redis                     | Cloudflare R2, served from its own domain                     | Anywhere; the default off Netlify                       |
| `local`         | `.data/records-{ns}.json`         | `.data/media`, served by `/api/local-media`                   | A developer's computer only; refused on Netlify (D-031) |

Netlify Blobs needs no account beyond the site's own: inside Netlify the
function's environment carries its credentials. The command-line tools
(`pnpm seed`, `pnpm data`) reach the same stores from a laptop with
`NETLIFY_SITE_ID` and a personal `NETLIFY_AUTH_TOKEN`. Both stores are opened
with strong consistency (the default, eventual, could serve a read up to a
minute old to the re-render after an admin's save) and on first use, so a
build or dev server without Netlify never fails at import. The SDK gets its own
`fetch` (`blobsFetch`): never cached, and each body read in full, because the
SDK cancels unread bodies and cancelling Next.js's tee'd body hangs forever.

| File                         | Responsibility                                                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`                   | The front door: cached public reads (`getPublicEvents`, `getGallery`, `getTeam`, `getRecruitment`), `publicRead`/`adminRead`, `repositories()`, `allowSignInAttempt()` |
| `runtime.ts`                 | Builds the real services from the environment (`dataAvailability`, `hostedMediaFiles`); shared by the app and the scripts                                              |
| `entity.ts`                  | The generic repository: validation on write and read, versions, files, cache tags                                                                                      |
| `events.ts`                  | Events, `listPublic`, `splitByPhase` (current / timeline at request time)                                                                                              |
| `gallery.ts`                 | Standalone photos, `buildGallery` (event photos + club photos), `mergeGallery`/`sortGallery` (any sources, the Git archive too, newest first)                          |
| `team.ts`                    | Team members, `append` (end of the tier), `reorder`, `groupTeam` (core, then secretaries by domain)                                                                    |
| `recruitment.ts`             | The one settings record: `get`, `getStatus` (closed by default), `save`                                                                                                |
| `sponsorships.ts`            | Requests from /contact: `submit` (rate-limited per sender), `list` (newest first, paged), `setStatus`, `remove`                                                        |
| `sign-in-limit.ts`           | The admin password sign-in's attempt limit: 10 per address and 20 per email in 15 minutes, on `hit()` with hashed keys; in memory when the store is missing or failing |
| `maintenance.ts`             | The nightly job: backup (30 kept), orphan sweep (24 h grace, safety valve), restore (D-034)                                                                            |
| `media.ts`                   | Upload tickets, attach checks, deletes                                                                                                                                 |
| `keys.ts`                    | Every Redis key and storage key, from `DATA_NAMESPACE`                                                                                                                 |
| `tags.ts`                    | Cache tag names shared by reads and writes                                                                                                                             |
| `errors.ts`                  | Errors with admin-facing messages (not found, conflict, invalid, media, rate-limited)                                                                                  |
| `adapters/types.ts`          | The two ports: `RecordStore` and `ObjectStorage`                                                                                                                       |
| `adapters/redis-store.ts`    | `RecordStore` on Upstash (atomic writes and rate-limit counters by Lua script)                                                                                         |
| `adapters/r2-storage.ts`     | `ObjectStorage` on Cloudflare R2                                                                                                                                       |
| `adapters/memory-*.ts`       | In-memory versions of both ports, for the unit tests                                                                                                                   |
| `adapters/file-store.ts`     | Local data mode's `RecordStore`: the memory store loaded from `.data/records-{ns}.json`, writes queued process-wide (D-031, D-032)                                     |
| `adapters/file-storage.ts`   | Local data mode's `ObjectStorage`: files in `.data/media`, HMAC-signed PUT URLs on `/api/local-media` (D-031)                                                          |
| `adapters/hosted-uploads.ts` | Signing, receiving (type, size, parts) and serving rules shared by the two storages the app hosts itself: local and Netlify Blobs                                      |
| `adapters/netlify-blobs.ts`  | Opening a Blobs store, the SDK calls the adapters use, the compare-and-swap loop, a per-key queue                                                                      |
| `adapters/blobs-store.ts`    | `RecordStore` on Netlify Blobs: one JSON blob per collection, written by compare-and-swap on its etag; counters as small blobs                                         |
| `adapters/blobs-storage.ts`  | `ObjectStorage` on Netlify Blobs: type, size and upload time in metadata; uploads and serving through `/api/local-media`                                               |

## Reads and writes

```ts
// A public page (server component):
const { current, timeline } = await getPublicEvents(); // inside <Suspense>

// A Server Action: adminAction() re-checks the session (rule 8) and turns a
// DataError into an ActionResult for the form (src/lib/auth/README.md).
return adminAction((admin) =>
  repositories().events.update(id, expectedUpdatedAt, changes, admin.email),
);
```

- **Public reads** are `'use cache'` + `cacheTag` + `cacheLife('hours')` and
  never read the current time. `getPublicEvents()` splits current from
  timeline **after** `connection()`, outside the cache (rule 12), so render it
  inside `<Suspense>`. Public results never carry `updatedBy`.
- **Writes** call `updateTag` for their entity's tags (rule 10), which Next.js
  allows only in Server Actions. Admin reads are never cached.
- **Errors** an admin can act on are `DataError`s; show their message. An
  `InvalidDataError` also lists `issues` per field for the form.
- **Public pages read through `publicRead(what, load)`** inside `<Suspense>`:
  an outage returns `{ failed }` and the page shows `<LoadFailed>`, never an
  error page (rule 9).
- **Admin pages read through `adminRead(what, load)`**: fresh, after
  `connection()`, and returning `{ unavailable }` instead of throwing when no
  store is configured or it fails. `dataAvailability()` says which backend is in
  use and whether records and files can be reached.
- **Local data mode** (`DATA_BACKEND=local`, D-031): records and files in
  `.data/`, same upload flow as Netlify Blobs (signed PUT to
  `/api/local-media`, verify on attach). For a developer's computer only;
  Netlify refuses it.

| Entity              | Collection    | Tags                            | Files (`UPLOAD_TARGETS`)      |
| ------------------- | ------------- | ------------------------------- | ----------------------------- |
| Event               | `event`       | `events` (the gallery too)      | `event-poster`, `event-photo` |
| GalleryPhoto        | `gallery`     | `gallery`                       | `gallery-photo`               |
| TeamMember          | `member`      | `team`                          | `member-photo`                |
| RecruitmentSettings | `settings`    | `recruitment`                   | `roles-pdf`                   |
| SponsorshipRequest  | `sponsorship` | none (admin only, never cached) | none                          |

## Redis keys

| Key                           | Type       | Holds                                                                                                           |
| ----------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `sig:{ns}:{collection}:{id}`  | hash       | `data` (the record's JSON) and `version`                                                                        |
| `sig:{ns}:{collection}:index` | sorted set | the collection's ids, scored for ordering                                                                       |
| `sig:{ns}:ratelimit:{key}`    | string     | a counter that expires (`hit()`, D-032): `sponsorship:{hash}`, `sign-in:address:{hash}`, `sign-in:email:{hash}` |

`{ns}` is `DATA_NAMESPACE`: `prod`, `preview`, `dev`, or `test-…` for the live
tests. Index scores: events by start time, gallery photos and sponsorship
requests by creation time, team members by tier then order.

## Netlify Blobs keys

| Store         | Key                              | Holds                                                                  |
| ------------- | -------------------------------- | ---------------------------------------------------------------------- |
| `sig-records` | `{ns}/records/{collection}.json` | `{ records: { [id]: { data, version, score } }, writeId }`             |
| `sig-records` | `{ns}/counters/{sha256(key)}`    | `{ hits, expiresAt, writeId }`, a rate-limit counter                   |
| `sig-media`   | `{ns}/…`                         | the same files as R2 (below), metadata `contentType, size, uploadedAt` |
| `sig-media`   | `{ns}/…/{file}.part-{i}`         | one part of an upload in progress (see Uploads)                        |

**Writes** read the collection's blob, apply the memory store's checks and
changes, and write it back only if its etag is unchanged (`onlyIfMatch`, or
`onlyIfNew` for the first record); otherwise they read again and retry, up
to eight times with jittered backoff. A failed check is never retried. Each
write carries a fresh `writeId`: the SDK reports some failures as success
with no etag, and a reply can be lost after the write landed, so the
outcome is confirmed by reading the `writeId` back. Writes to one blob from
one instance queue in memory, so only other instances contend.

**Every write the app makes touches one collection** (each repository
writes its own), which is atomic. A batch spanning collections is checked
against all of them first, then written collection by collection; if a
later one cannot be written, `PartialWriteError` names what was saved.

Blobs do not expire: a counter past its window simply starts again at 1.
Site-wide stores are shared by production and every preview, so
`DATA_NAMESPACE` is the only separation, exactly as with Redis and R2.

## Files (R2 or Netlify Blobs)

| Key                                        | Contents                   |
| ------------------------------------------ | -------------------------- |
| `{ns}/events/{eventId}/poster/{rand}.webp` | event poster               |
| `{ns}/events/{eventId}/photos/{rand}.webp` | event photos               |
| `{ns}/gallery/{photoId}/{rand}.webp`       | standalone gallery photo   |
| `{ns}/team/{memberId}/{rand}.webp`         | team member photo          |
| `{ns}/recruitment/{rand}.pdf`              | roles and responsibilities |
| `{ns}/backups/{yyyy-mm-dd}.json`           | nightly backup (D-034)     |

Images may also be `.jpg`, `.png` or `.avif` when the browser could not
convert them; limits are in `src/lib/schemas/upload.ts` (images 5 MB, PDF
10 MB).

## Uploads (rule 11)

Files never pass through a Server Action: request bodies are size-capped,
and an event can take dozens of photos at once. With R2 they pass through no
function at all; storage the app hosts itself receives them on its own route,
one file (or part) per request.

1. The admin UI generates the record's id (`crypto.randomUUID()`) for a new
   record and compresses images to WebP in the browser.
2. It POSTs an `UploadRequest` to `/api/admin/upload`, which re-checks the
   session (rule 8) and returns an `UploadTicket`: a presigned PUT URL valid
   for five minutes, under the record's folder.
3. The browser PUTs the file straight to R2 with the ticket's headers. With
   storage the app hosts itself (Netlify Blobs, local mode) the URL is an
   HMAC-signed one on `/api/local-media`, and the ticket's `partBytes`
   (4 MiB) says the PUT goes through a function whose body is capped near
   6 MB: a larger file (the 10 MB PDF) is sent as consecutive parts to the
   same URL with `&part=i&parts=n`. The route stores each part as
   `<key>.part-<i>`; the last part assembles the file and deletes the parts.
   It refuses (before storing anything) a bad or expired signature (403), a
   content type that is not an allowed upload type matching the key's
   extension (415, so a signed URL can never store `text/html`), a body over
   the kind's limit (413) and a missing earlier part (409). It serves only
   upload keys — never a backup or a part — streamed, with `nosniff` and a
   sandboxing CSP.
4. The UI calls a Server Action with the resulting URLs. Saving the record
   verifies every newly attached URL — ours, this namespace, this record and
   field, uploaded, an allowed type, within the limit — and deletes an upload
   that fails. Then it saves and calls `updateTag`.

Files a record stops using (a replaced poster, a removed photo, a deleted
record) are deleted after the record is saved. A failed delete is logged and
left to the nightly orphan sweep (`maintenance.ts`, D-034), which also removes uploads that
were never attached and the parts of an abandoned upload.

## Rules

- Validate with Zod on every write **and** every read. A corrupt record is
  logged and skipped, never allowed to crash a public page.
- Every write is atomic: one Lua script on Redis, one compare-and-swap of the
  collection's blob on Netlify Blobs. It checks each record's version, then
  writes records and indexes together, so indexes cannot drift.
- Updates and deletes carry the `updatedAt` the admin's form was loaded with
  and fail with a `ConflictError` ("changed by someone else") if it moved.
- Nothing in a cached function reads the current time.
- A new storage backend implements `RecordStore` or `ObjectStorage` and passes
  the contract tests in `tests/unit/data`; nothing above the ports changes.

## Tests and tools

- `GET /api/health` — on any deployment: the backend in use and whether a read
  works (`ok`, `backend`, `records`, `uploads`); 200 or 503, never any data
  (D-041).

- `pnpm test` — schemas, repositories and media on the in-memory adapters;
  the local and Netlify Blobs backends against the same store contract and
  a hosted-storage contract (`hosted-storage-contract.ts`). Blobs runs on an
  in-memory fake with atomic conditional writes (the SDK's local server
  checks conditions non-atomically), plus a short suite on that server for
  metadata, binary bodies and listing.
- `pnpm test:live` — the same store contract plus a full create → update →
  delete cycle against the real Upstash and R2, in a throwaway namespace;
  checks that no key or file is left behind.
- `pnpm seed --demo` — adds labelled sample records, and opens recruitment if
  it was never saved (never in `prod`).

## Rate limit (Stage 8, D-032)

`RecordStore.hit(key, windowSeconds)` counts hits in a window that opens with
the first hit and then expires. `sponsorships.submit(form, { from })`
validates the form first, then counts one hit against a hash of the sender's
address (never the address itself), and refuses the fourth valid request in
an hour with a `RateLimitedError` (`reason: 'limited'` for the form). Local
mode keeps the counters in memory; a restart clears them. Netlify Blobs keeps
each in its own small blob, updated by compare-and-swap.

Built in **Stages 5–8**.
