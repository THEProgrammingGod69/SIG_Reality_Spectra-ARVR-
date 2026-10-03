# `src/components/admin`

The admin panel's components (D-030). shadcn/ui is used **here only** (in
`ui/`); the public site uses the primitives in `src/components/ui`, and the
admin may reuse those too (`EmptyState`, `Skeleton`, `Icon`, `BrandMark`).

| File                    | Does                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `admin-shell.tsx`       | The panel frame: sidebar or top bar, the page, toasts, the unsaved-changes guard       |
| `admin-navigation.tsx`  | Navigation, signed-in email, sign-out — the sidebar (`lg`+) and the mobile sheet       |
| `admin-page.tsx`        | `AdminPageHeader` (title and description from `adminRoutes`)                           |
| `toaster.tsx`           | `ToastProvider`, `useToast()`: `toast(message)`, `notify(actionResult, success)`       |
| `unsaved-changes.tsx`   | `useUnsavedChanges(isDirty)`, `GuardedLink`, `useLeaveGuard()`                         |
| `form-field.tsx`        | `FormField`, `CheckboxField` (label, hint, error wiring); `inputProps`/`checkboxProps` |
| `form-feedback.tsx`     | `useRecordVersion()` (version, save/delete reporting), `ConflictNotice`, `SaveBar`     |
| `confirm-delete.tsx`    | `ConfirmDelete`: the one delete button, which asks first                               |
| `upload-file.ts`        | Browser half of uploads: WebP conversion (≤ 2400 px), ticket, PUT with progress        |
| `upload-dropzone.tsx`   | Drop or pick files; progress bars, retry; one record or a new id per file              |
| `image-fields.tsx`      | `ImageField` (one image + alt: posters, team photos), `PhotoListField` (event photos)  |
| `pdf-field.tsx`         | `PdfField`: open, replace or remove one PDF (the roles PDF)                            |
| `event-list.tsx`        | `EventRow`/`EventList`: events linking to their editor (dashboard, events tool)        |
| `event-phase-badge.tsx` | The panel's name for each event phase                                                  |
| `data-unavailable.tsx`  | "Data store not connected" / "could not reach the data store"                          |
| `ui/`                   | Reviewed shadcn/ui primitives (see its README)                                         |

## Building a tool screen (Stages 7–8)

- Start the page with `<AdminPageHeader href="/admin/…" />` and read its data with
  `adminRead()` (shows `DataUnavailable` when there is no store).
- Forms: react-hook-form + the entity's `XInputSchema`; fields through
  `FormField`/`CheckboxField` with `inputProps`/`checkboxProps`; call
  `useUnsavedChanges(formState.isDirty)`.
- Save through a Server Action wrapped in `adminAction()`; keep the record's
  version with `useRecordVersion()`, whose `saved()`/`deleted()` report the
  result (toast, field issues, `ConflictNotice` on `reason: 'conflict'`).
- End an editor with `<SaveBar>`; delete only through `<ConfirmDelete>`.
- Navigate within the panel with `GuardedLink`, never a bare `Link`.

The tools, under `src/app/admin/(panel)`: **events** (editor by phase) and
**gallery** (batch upload) in Stage 7; **team** (editor, core-team reorder),
**recruitment** (status, form link, roles PDF) and **sponsorships** (inbox,
status, delete) in Stage 8 (D-032).

Built in **Stage 6** (shell) and **Stages 7–8** (tools).
