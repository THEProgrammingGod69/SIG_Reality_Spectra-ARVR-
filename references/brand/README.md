# `references/brand`

| File           | What it is                                      |
| -------------- | ----------------------------------------------- |
| `SIG_LOGO.svg` | Club logo as supplied (see the caveat below).    |

## Caveat on the current logo file

`SIG_LOGO.svg` is an SVG **wrapper around a base64-encoded PNG**, not true
vector artwork, and it carries an opaque white background rectangle. Practical
consequences:

- It cannot be recoloured, and it will not stay crisp when scaled up.
- The white background will show as a white box on the dark site.
- It is ~1.7 MB, which is far too heavy to ship in a navbar.

**Needed before Stage 3** (tracked in `docs/OPEN_ITEMS.md`):

- A real vector logo (paths, not an embedded raster), with a transparent background.
- Light and dark variants, plus a square mark for the favicon and OpenGraph images.

If no vector original exists, a background-removed, trimmed PNG at 2× the largest
display size is an acceptable fallback — say so and it will be handled that way.
