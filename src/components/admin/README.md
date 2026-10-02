# `src/components/admin`

The admin panel's components (D-030). shadcn/ui is used **here only** (in
`ui/`); the public site uses the primitives in `src/components/ui`, and the
admin may reuse those too (`EmptyState`, `Skeleton`, `Icon`, `BrandMark`).

| File                   | Does                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `admin-shell.tsx`      | The panel frame: sidebar or top bar, the page, toasts, the unsaved-changes guard        |
| `admin-navigation.tsx` | Navigation, signed-in email, sign-out — the sidebar (`lg`+) and the mobile sheet        |
| `admin-page.tsx`       | `AdminPageHeader` (title and description from `adminRoutes`); `PlannedTool` (temporary) |
| `toaster.tsx`          | `ToastProvider`, `useToast()`: `toast(message)`, `notify(actionResult, success)`        |
| `unsaved-changes.tsx`  | `useUnsavedChanges(isDirty)`, `GuardedLink`, `useLeaveGuard()`                          |
| `ui/`                  | Reviewed shadcn/ui primitives (see its README)                                          |

## Building a tool screen (Stages 7–8)

- Start the page with `<AdminPageHeader href="/admin/…" />`.
- Forms: react-hook-form + the entity's `XInputSchema`; call
  `useUnsavedChanges(formState.isDirty)`.
- Save through a Server Action wrapped in `adminAction()` and report the
  result with `useToast().notify(result, 'Saved')`; on `reason: 'conflict'`,
  offer a reload; show `result.issues` beside their fields.
- Navigate within the panel with `GuardedLink`, never a bare `Link`.

Planned building blocks:

- **Uploader** — generates a new record's id, compresses images to WebP in the
  browser, asks `/api/admin/upload` for a presigned URL and PUTs the file
  straight to R2 with plain `fetch` (no storage client), shows progress and
  retry, then hands the URLs to a Server Action. Contract and limits:
  `src/lib/schemas/upload.ts`; flow: `src/lib/data/README.md`.
- **Event editor** — details, registration link and poster; for past events the
  recap, photos and the final "add to timeline" step. Its preview renders the
  _same_ public sections the site uses, so preview and production cannot drift.
- **Gallery manager** — bulk-upload standalone club photos with a category and alt
  text; lists standalone photos only (event photos are managed in the event editor).
- **Team editor** — name, position, photo, tier (core or secretary), the
  secretary's domain, and ordering (D-027).
- **Recruitment panel** — open/closed toggle, roles PDF and Google Form link.
- **Sponsorship inbox** — list, detail and status.

Built in **Stage 6** (shell) and **Stages 7–8** (tools).
