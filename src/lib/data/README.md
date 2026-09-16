# `src/lib/data` — repository layer

**The only code in this project allowed to import `@upstash/redis` or
`@vercel/blob`.** This is enforced by a `no-restricted-imports` ESLint rule, so
breaking it fails `pnpm lint`.

Planned modules:

| File              | Responsibility                                                                          |
| ----------------- | --------------------------------------------------------------------------------------- |
| `keys.ts`         | Builds every Redis key from `REDIS_KEY_PREFIX` — no hand-written key strings elsewhere  |
| `tags.ts`         | Cache tag names (`events`, `team`, `recruitment`) shared by reads and writes            |
| `events.ts`       | Events: create, update, remove, add/remove photos, add to timeline; cached public reads |
| `team.ts`         | Team members: create, update, remove, reorder; cached public reads                      |
| `recruitment.ts`  | Recruitment settings: `get` (safe defaults), `update`                                   |
| `sponsorships.ts` | Sponsorship requests: `create`, `list` (newest first, paginated), `updateStatus`        |
| `media.ts`        | Browser-upload token issuing, attachment checks, deletes — no orphaned blobs            |

## Redis keys

| Key                             | Type       | Holds                                           |
| ------------------------------- | ---------- | ----------------------------------------------- |
| `{prefix}:event:{id}`           | JSON       | one Event (details, photos, timeline flag)      |
| `{prefix}:events:by-start`      | sorted set | event ids scored by start time                  |
| `{prefix}:member:{id}`          | JSON       | one TeamMember                                  |
| `{prefix}:members:order`        | sorted set | member ids scored by hierarchy tier, then order |
| `{prefix}:settings:recruitment` | JSON       | RecruitmentSettings                             |
| `{prefix}:sponsorship:{id}`     | JSON       | one SponsorshipRequest                          |
| `{prefix}:sponsorships:by-date` | sorted set | request ids scored by creation time             |
| `{prefix}:ratelimit:*`          | —          | managed by the rate limiter                     |

## Blob paths

| Path                                  | Contents                            |
| ------------------------------------- | ----------------------------------- |
| `events/{eventId}/poster-{rand}.webp` | event poster                        |
| `events/{eventId}/photos/{rand}.webp` | past-event photos                   |
| `team/{memberId}-{rand}.webp`         | team member photo                   |
| `recruitment/roles-{rand}.pdf`        | roles and responsibilities          |
| `backups/{yyyy-mm-dd}.json`           | nightly backup of all Redis records |

## Uploads

Files never pass through a Server Action: function request bodies are size-capped,
and a past event can carry dozens of photos. Instead:

1. The admin UI compresses images to WebP in the browser.
2. It asks `/api/admin/upload` for a short-lived token. `media.ts` issues one only
   for a valid admin session, an allowed content type and size, and a pathname
   under the record being edited.
3. The browser uploads straight to Blob.
4. The UI calls a Server Action with the resulting URLs. The action re-checks the
   session, verifies each URL belongs to our store and the expected path, saves
   the record and calls `updateTag`.

`updateTag` only works inside Server Actions, which is why step 4 exists instead
of attaching files in the upload route's completion callback. Uploads that are
never attached are removed by the nightly orphan sweep.

## Rules

- Validate with Zod on every write **and** every read. A corrupt record is
  skipped and logged, never allowed to crash a public page.
- Multi-key writes use transactions so indexes cannot drift.
- Updates carry an `updatedAt` check and reject stale edits.
- Deleting a record deletes its blobs; replacing a file deletes the old one.
- Public reads are `'use cache'` functions tagged with `cacheTag`. Admin reads are
  never cached. Nothing inside a cached function reads the current time.
- Everything sits behind an interface (`EventsRepository`, …) so a Postgres
  implementation can replace Redis by changing one import.

Built in **Stage 5**.
