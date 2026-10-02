# `references/brand`

Logo masters from the club's brand pack (`Stage_3_Vectorization/SIG_brand_assets.zip`,
October 2026). Full resolution, transparent backgrounds. **Not shipped**: the site
uses web-sized copies in `src/assets/brand/` (D-021).

| File                     | What it is                                                     | Use                       |
| ------------------------ | -------------------------------------------------------------- | ------------------------- |
| `logo-badge.png`         | The original badge: black roundel, white lettering (2868px)    | Footer; works on dark and light |
| `logo-mark-on-dark.png`  | Round headset mark with a white ring (1463px)                  | Header, favicon, Apple icon |
| `logo-mark-on-light.png` | Round headset mark with a black ring (1463px)                  | Light backgrounds, print  |

## Notes

- **Raster, not vector.** The pack's SVG files only wrap these same PNGs
  (0.7–1.9 MB each), so they were not kept. A hand-drawn vector of the mark would
  sharpen the favicon at 16px; it is a nice-to-have.
- **The pack's "dark" badge was rejected.** It turned the black ring white, but the
  lettering was already white, so the text disappeared. The original badge reads
  well on the site's dark background as it is.
- **Regenerating the web copies:** trim the transparent margin, then resize with
  Lanczos to 768px (badge) and 256px (mark) into `src/assets/brand/`; the mark at
  256px is also `src/app/icon.png`, and `src/app/apple-icon.png` is the mark on
  `--color-bg` at 180px (iOS ignores transparency).
