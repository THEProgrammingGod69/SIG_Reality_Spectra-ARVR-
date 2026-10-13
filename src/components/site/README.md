# `src/components/site`

The public site's chrome, built in **Stage 3** and rendered by
`src/app/(site)/layout.tsx` and `template.tsx`.

| File                  | What it is                                                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `site-header.tsx`     | Fixed header: logo, PillNav (`lg`+), Recruitment CTA (marked while open), Menu toggle; glass on scroll, with the reading-progress hairline (D-037) |
| `pill-nav.tsx`        | Desktop links — our rebuild of React Bits' PillNav (D-020)                                                                                         |
| `mobile-menu.tsx`     | Full-screen menu below `lg` — our rebuild of StaggeredMenu (D-020); "Open now" tag while recruiting                                                |
| `site-footer.tsx`     | Logo badge, every page by group, contact channels once set, VIT Pune credit, the wordmark and "Back to top" (D-037)                                |
| `film-grain.tsx`      | A static film-grain layer over the page, under the header, from `md` up (D-037)                                                                    |
| `hash-target.tsx`     | `data-targeted` on the element the URL fragment names: client navigations never set `:target` (D-037)                                              |
| `page-transition.tsx` | Opacity fade on client navigations only (never the first load); plain CSS, no library (D-033)                                                      |
| `web-analytics.tsx`   | Cloudflare Web Analytics beacon: only with its token, never under `next dev` (D-033)                                                               |
| `json-ld.tsx`         | `<JsonLd>`: schema.org data as an escaped script tag (Home, Events)                                                                                |

Rules:

- Links come from `siteRoutes` (`src/lib/site.ts`); nothing here hardcodes a page.
- Contact channels come from `src/content/contact.json` (`siteChannels` in
  `src/lib/content.ts`) and render only when set, so no placeholder
  link ever ships. Nothing here links to `/admin` (rule 6; an e2e test checks).
- The header is fixed and overlays the page; a page that opens with a
  full-bleed section marks it `data-full-bleed` so `<main>` drops its top padding.
- Overlays (mobile menu, Modal) lock scrolling through
  `components/motion/scroll-lock.ts`, which also stops Lenis.
