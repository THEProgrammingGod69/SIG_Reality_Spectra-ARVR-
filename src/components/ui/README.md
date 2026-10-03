# `src/components/ui`

Design-system primitives, built in **Stage 3**. See every one, in every state, at
`/dev/ui` (development only).

| File              | Exports                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `button.tsx`      | `Button`, `ButtonLink` — primary · secondary · ghost · star; sm · md · lg; icon, loading, external, magnetic              |
| `card.tsx`        | `Card`, `CardMedia` (fixed ratio), `CardBody`, `CardTitle` (2-line clamp), `CardDescription` (3-line clamp), `CardFooter` |
| `badge.tsx`       | `Badge` — neutral · accent · success · warning · danger                                                                   |
| `container.tsx`   | `Container` — `content` (1200px) or `prose` width, page gutter                                                            |
| `section.tsx`     | `Section` — `py-section` rhythm, labelled landmark, Container                                                             |
| `heading.tsx`     | `Heading` — level 1–4, size `2xl`–`sm` on the display scale                                                               |
| `text.tsx`        | `Text` (body sizes and tones), `Eyebrow` (mono uppercase label)                                                           |
| `field.tsx`       | `Field` (label, hint, error, ARIA wiring), `Input`, `Textarea`, `Select`                                                  |
| `modal.tsx`       | `Modal` — native `<dialog>`, focus trap, Escape, scroll lock                                                              |
| `skeleton.tsx`    | `Skeleton` — loading placeholder with a 10% spectrum shimmer                                                              |
| `empty-state.tsx` | `EmptyState` — every list's "nothing here yet" (rule 9)                                                                   |
| `icon.tsx`        | `Icon` — Lucide at sm · md · lg, stroke 1.5, decorative unless labelled                                                   |
| `logo.tsx`        | `BrandMark`, `BrandBadge` — the club logo via `next/image`                                                                |
| `qr-code.tsx`     | `QrCode` — server-only SVG QR generated from a link, token colours (D-023)                                                |

Rules:

- Token-driven only: colours as `(--color-*)`, type as `text-display-*` /
  `text-body*` / `text-label`, space as `py-section` / `px-gutter`, shape as
  `rounded-card` / `rounded-control`. No raw hex, px colour or duration.
- Merge classes with `cn()` from `@/lib/cn`, so a caller's `className` overrides
  cleanly.
- Rule 4 includes colour (D-022): hover colour changes are instant; animated
  feedback is an `opacity` overlay or a `transform`.
- Keyboard accessible with a visible focus ring (the global `:focus-visible`).
- No data fetching and no business logic. These are presentational.
- shadcn/ui components are admin-only and live in `src/components/admin/ui`.
