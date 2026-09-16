# `public/`

Served verbatim at the site root. Nothing here is processed, bundled or
fingerprinted, so only put files here that must keep a stable URL.

```
public/
  images/    content images — WebP, 300 KB or less each      (Stage 4)
  models/    3D models — .glb, compressed, ideally <2 MB     (Stage 2)
  fonts/     self-hosted brand fonts, if not from Google     (Stage 3)
  docs/      sponsor brochure PDF and similar downloads      (Stage 8)
```

The Next.js starter icons have been removed. A real favicon and app icons are
added in Stage 3, once the vector logo lands — see `docs/OPEN_ITEMS.md`.

Design and animation inputs do **not** belong here; they live in `references/`,
which is outside the served tree.
