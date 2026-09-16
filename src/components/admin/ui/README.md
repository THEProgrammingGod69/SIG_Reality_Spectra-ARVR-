# `src/components/admin/ui`

shadcn/ui primitives, vendored here by the shadcn CLI.

This path is the `ui` alias in `components.json`, which is deliberate: the locked
stack says **shadcn/ui is admin only**. Pointing the alias here means

```bash
pnpm exec shadcn add button
```

lands in the admin area by default and cannot silently leak into the public
design system in `src/components/ui/`.

The public site uses our own token-driven primitives. Do not import anything from
this folder outside `src/app/admin/` or `src/components/admin/`.

Populated from **Stage 6** onwards.
