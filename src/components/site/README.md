# `src/components/site`

The public site's chrome, built in **Stage 3** and rendered by
`src/app/(site)/layout.tsx` and `template.tsx`.

| File                   | What it is                                                                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `site-header.tsx`      | Fixed header: logo, HudNav (`lg`+), Recruitment CTA (marked while open), Menu toggle; glass on scroll, with the reading-progress hairline (D-037)    |
| `hud-nav.tsx`          | Desktop links — the HUD rail: numbered readouts, a gliding lock-on frame, a scroll readout (D-038, replaces PillNav)                                 |
| `mobile-menu.tsx`      | Full-screen menu below `lg` — the aperture: shutter slats, one scan, rising links (D-038); "Open now" tag while recruiting                           |
| `recruitment-mark.tsx` | `WhenRecruitmentOpen`: the header's "open" marks, streamed from a promise so the header and menu never wait for the store (D-041)                    |
| `reticle-cursor.tsx`   | The targeting reticle: brackets lock onto links, buttons and fields; mouse only, system cursor kept (D-038)                                          |
| `site-footer.tsx`      | Logo badge, every page by group, contact channels once set, VIT Pune credit, the wordmark, "Back to top" (D-037) and the small "Admin" link (rule 6) |
| `film-grain.tsx`       | A static film-grain layer over the page, under the header, from `md` up (D-037)                                                                      |
| `hash-target.tsx`      | `data-targeted` on the element the URL fragment names: client navigations never set `:target` (D-037)                                                |
| `page-transition.tsx`  | Client navigations only (never the first load): the page fades in behind a five-slat shutter; plain CSS, no library (D-033, D-038)                   |
| `web-analytics.tsx`    | Cloudflare Web Analytics beacon: only with its token, never under `next dev` (D-033)                                                                 |
| `json-ld.tsx`          | `<JsonLd>`: schema.org data as an escaped script tag (Home, Events)                                                                                  |

Rules:

- Links come from `siteRoutes` (`src/lib/site.ts`); nothing here hardcodes a
  page, except the footer's one admin link.
- Contact channels come from `src/content/contact.json` (`siteChannels` in
  `src/lib/content.ts`) and render only when set, so no placeholder
  link ever ships.
- The only link to `/admin` is the footer's small "Admin" link to
  `/admin/login` (rule 6): `rel="nofollow"`, `prefetch={false}`, never in the
  header or menu and never in `siteRoutes`. `tests/e2e/admin.spec.ts` checks
  that every public page has exactly one, inside the footer.
- The header is fixed and overlays the page; a page that opens with a
  full-bleed section marks it `data-full-bleed` so `<main>` drops its top padding.
- Overlays (mobile menu, Modal) lock scrolling through
  `components/motion/scroll-lock.ts`, which also stops Lenis.
