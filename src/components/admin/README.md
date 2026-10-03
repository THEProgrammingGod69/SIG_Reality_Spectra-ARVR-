# `src/components/admin`

The admin panel's components (D-030). shadcn/ui is used **here only** (in
`ui/`); the public site uses the primitives in `src/components/ui`, and the
admin may reuse those too (`EmptyState`, `Skeleton`, `Icon`, `BrandMark`).

| File                    | Does                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------- |
| `admin-shell.tsx`       | The panel frame: sidebar or top bar, the page, toasts, the unsaved-changes guard        |
| `admin-navigation.tsx`  | Navigation, signed-in email, sign-out — the sidebar (`lg`+) and the mobile sheet        |
| `admin-page.tsx`        | `AdminPageHeader` (title and description from `adminRoutes`); `PlannedTool` (temporary) |
| `toaster.tsx`           | `ToastProvider`, `useToast()`: `toast(message)`, `notify(actionResult, success)`        |
| `unsaved-changes.tsx`   | `useUnsavedChanges(isDirty)`, `GuardedLink`, `useLeaveGuard()`                          |
| `form-field.tsx`        | `FormField` (label, hint, error wiring); `inputProps`/`checkboxProps`; `blankToNull`    |
| `form-feedback.tsx`     | `reportFailure()` (field issues + toast), `ConflictNotice` (someone else saved)         |
| `upload-file.ts`        | Browser half of uploads: WebP conversion (≤ 2400 px), ticket, PUT with progress         |
| `upload-dropzone.tsx`   | Drop or pick files; progress bars, retry; one record or a new id per file               |
| `image-fields.tsx`      | `ImageField` (one image + alt: posters, team photos), `PhotoListField` (event photos)   |
| `event-list.tsx`        | `EventRow`/`EventList`: events linking to their editor (dashboard, events tool)         |
| `event-phase-badge.tsx` | The panel's name for each event phase                                                   |
| `data-unavailable.tsx`  | "Data store not connected" / "could not reach the data store"                           |
| `ui/`                   | Reviewed shadcn/ui primitives (see its README)                                          |

## Building a tool screen (Stages 7–8)

- Start the page with `<AdminPageHeader href="/admin/…" />` and read its data with
  `adminRead()` (shows `DataUnavailable` when there is no store).
- Forms: react-hook-form + the entity's `XInputSchema`; call
  `useUnsavedChanges(formState.isDirty)`.
- Save through a Server Action wrapped in `adminAction()` and report the
  result with `useToast().notify(result, 'Saved')`; on `reason: 'conflict'`,
  offer a reload; show `result.issues` beside their fields.
- Navigate within the panel with `GuardedLink`, never a bare `Link`.

Built in Stage 7: the uploader (above), the **event editor**
(`src/app/admin/(panel)/events`) and the **gallery manager**
(`src/app/admin/(panel)/gallery`). Read them as the pattern for Stage 8.

Still to build (Stage 8):

- **Team editor** — name, position, photo, tier (core or secretary), the
  secretary's domain, and ordering (D-027).
- **Recruitment panel** — open/closed toggle, roles PDF and Google Form link.
- **Sponsorship inbox** — list, detail and status.

Built in **Stage 6** (shell) and **Stages 7–8** (tools).
