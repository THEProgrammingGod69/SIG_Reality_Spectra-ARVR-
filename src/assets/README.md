# `src/assets`

Static files that components **import** (`import mark from '@/assets/brand/…'`),
so `next/image` knows their size, serves resized WebP/AVIF and gives them
content-hashed, long-cached URLs. Files that need a fixed public URL go in
`public/` instead.

| Path                   | What it is                                                     |
| ---------------------- | -------------------------------------------------------------- |
| `brand/logo-badge.png` | Full badge, 768px, transparent — used by `BrandBadge` (footer) |
| `brand/logo-mark.png`  | Round mark with white ring, 256px — `BrandMark` (header, 404)  |

These are web-sized copies. The full-resolution masters live in
`references/brand/` (D-021); regenerate from those, never upscale these.
