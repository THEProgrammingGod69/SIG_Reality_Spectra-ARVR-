# `src/lib/data` — repository layer

**The only code in this project allowed to import `@upstash/redis` or
`@vercel/blob`.** This is enforced by a `no-restricted-imports` ESLint rule, so
breaking it fails `pnpm lint`.

Planned modules:

| File           | Responsibility                                               |
| -------------- | ------------------------------------------------------------ |
| `events.ts`    | `list`, `getBySlug`, `create`, `update`, `remove`, `reorder` |
| `settings.ts`  | `get` (with safe defaults), `update`                         |
| `enquiries.ts` | `create`, `list` (paginated), `updateStatus`                 |
| `media.ts`     | `uploadPoster`, `deletePoster` — no orphaned blobs           |

Rules:

- Validate with Zod on every write **and** every read. A corrupt record is
  skipped and logged, never allowed to crash a public page.
- Multi-key writes use transactions so indexes cannot drift.
- Everything sits behind an interface (`EventsRepository`, …) so a Postgres
  implementation can replace Redis by changing one import.
- Every write calls the revalidation helper for its cache tags.

Built in **Stage 5**.
