# `src/components/admin/ui`

shadcn/ui primitives, vendored here by the shadcn CLI and then **reviewed**
(D-030). This path is the `ui` alias in `components.json` on purpose: the
locked stack says **shadcn/ui is admin only**, so

```bash
pnpm exec shadcn add select
```

lands in the admin area and cannot leak into the public design system. Do not
import anything from this folder outside `src/app/admin/` or
`src/components/admin/`.

## After every `shadcn add`

The registry code is a starting point. Before it ships:

1. **Imports**: `cn` from `@/lib/cn`. If the CLI added an npm package named
   `cn` to `package.json`, remove it (`pnpm remove cn`). Make sure
   `class-variance-authority` and `radix-ui` are dependencies.
2. **Colours**: shadcn's names (`bg-background`, `bg-primary`, `bg-card`,
   `border-input`, `ring-ring`, `bg-destructive`, …) are aliases of our tokens
   in `globals.css`. `accent` and `muted` are **not**: rewrite `bg-accent` hover
   fills and `bg-muted` to `bg-secondary`. No raw colours (`bg-black/50` →
   `bg-(--color-void)/60`).
3. **Motion** (rule 4, D-022): delete `transition-all`, `transition-[color,…]`
   and plain `transition`; delete `animate-in`/`animate-out`/`fade-*`/`zoom-*`/
   `slide-*` classes (tw-animate-css is not installed). A press scale or an
   opacity fade on the motion tokens is fine.
4. **Layers and sizes**: `z-(--z-overlay)` instead of `z-50`; radii
   `rounded-control` / `rounded-card`; text on the type scale (`text-body-sm`).
5. **Icons** through `<Icon>` (1.5 stroke).

| Component    | From shadcn | Notes                                                    |
| ------------ | ----------- | -------------------------------------------------------- |
| alert-dialog | yes         | trimmed to what the panel uses; opens instantly          |
| badge        | yes         | `success` / `warning` / `destructive` outline tones      |
| button       | yes         | press scale only; sizes `sm` · `default` · `lg` · `icon` |
| card         | yes         | `rounded-card`, `shadow-card`                            |
| input, label | yes         |                                                          |
| separator    | yes         |                                                          |
| sheet        | yes         | left/right only; opens instantly                         |

Skeletons and empty states come from the public `src/components/ui`.
