# Decision log

Product and design decisions made after the team review of the architecture
document, the SIG Style & Motion Board and the design inspiration board. Each
entry says what was decided, why, and what it changes. Add new decisions at the
bottom; never edit an old one — supersede it with a new entry.

**Decided by** is either _team_ (the club decided) or _lead_ (the club delegated
the call and it was made on the reasoning shown).

| ID    | Decision                                                                     | Decided by |
| ----- | ---------------------------------------------------------------------------- | ---------- |
| D-001 | Hero direction: **Orbit Lab**                                                | lead       |
| D-002 | Fonts: **Space Grotesk · Inter · JetBrains Mono**                            | lead       |
| D-003 | Caption colour `text-subtle` is **`#797F8D`**                                | team       |
| D-004 | Vendored components come from **React Bits only**                            | lead       |
| D-005 | Gallery shows **event photos and standalone club photos**                    | team       |
| D-006 | Contact and sponsorship are **one page**                                     | team       |
| D-007 | No stat counters on Home in v1                                               | lead       |
| D-008 | No email: sponsorship requests live in the admin inbox                       | lead       |
| D-009 | Rule 4 has **no exceptions**; blur/layout-animating effects are rewritten    | lead       |
| D-010 | The hero has **one WebGL context**, and its name is real text at first paint | lead       |
| D-011 | No `ogl`, no second WebGL library                                            | lead       |
| D-012 | Navigation: PillNav on desktop, StaggeredMenu on mobile                      | lead       |
| D-013 | Component shortlist and rejections                                           | lead       |
| D-014 | Repo stays private while vendored React Bits code is inside                  | lead       |
| D-015 | Style Board colours adopted in Stage 2 ("tokens before hero")                | lead       |
| D-016 | MagicRings is ported into the R3F scene, not used as its own canvas          | lead       |
| D-017 | The static hero still is an inline SVG drawn from tokens, not a WebP         | lead       |
| D-018 | Hero scroll-out: pinned 150vh on 3D tiers only, handing over dimmed          | lead       |
| D-019 | Stage 3 additions: Lucide icons and one `cn()` helper                        | lead       |
| D-020 | Site shell: React Bits nav and effects rebuilt; header overlays the page     | lead       |
| D-021 | Logo: the original badge ships as raster; the pack's dark badge is rejected  | lead       |
| D-022 | Rule 4 covers colour: no colour or background transitions                    | lead       |
| D-023 | Content layer in `src/content`; QR codes generated from the links            | lead       |
| D-024 | Interim recruitment, honest placeholders, no fake sponsorship form           | team       |

---

## D-001 — Hero direction: Orbit Lab

**Choice.** The hero is the Orbit Lab concept: a dark lab, a low spectrum horizon,
concentric rings, and one wireframe headset as the only luminous object. The other
board directions (Passthrough, Spectrum Prism, Room-scale, Point Cloud, Reach) are
not built. Nothing is blended in from them at the hero level.

**Why.** It is the only direction that appears in both versions of the inspiration
board (four-direction and six-direction "Rev A"), so the question of which board is
current does not change the answer. It matches the Style Board's storyboard, needs no
extra libraries (rings are a three.js effect), and is the direction most likely to
hold 50 fps on a mid-range Android. The alternatives each add a second visual system
(HUD overlays, a light-splitting prism, a walkable 3D room) for one page.

**Changes.** Stage 2 builds this hero. The spectrum stays at or below 10% of any
screen.

## D-002 — Fonts: Space Grotesk, Inter, JetBrains Mono

**Choice.** Display and headings in Space Grotesk, body text in Inter, small labels
and code in JetBrains Mono. IBM Plex Sans and Unbounded are not used.

**Why.** The brief is a _cinematic, realistic XR lab, not gaming neon_. Unbounded is
very wide and rounded and reads as consumer-tech or gaming; Space Grotesk has a
technical, engineered feel. This is also the set the Style Board and the printed
architecture plan already use, so nothing has to be redone. Inter pairs with Space
Grotesk more neutrally than Plex and ships as a variable font.

**Changes.** Loaded through `next/font` (self-hosted, `display: swap`, Latin subset).
Keep it to four font files: Space Grotesk 500 and 700, Inter variable, JetBrains Mono 500. Stage 3 replaces the Geist stand-in in `src/app/layout.tsx`.

## D-003 — Caption colour `#797F8D`

**Choice.** `text-subtle` is `#797F8D`, for captions and metadata only.

**Why.** The Style Board's `#616774` measured 3.40:1 on the surface colour, and the
inspiration board's `#737987` measures 4.43:1 on surface and 4.20:1 on raised
surfaces — both below WCAG AA (4.5:1). `#797F8D` measures **5.03 / 4.81 / 4.56:1** on
`bg` / `surface` / `surface-raised`.

**Changes.** Stage 3 token value. Any text that needs to be read carries
`text-muted` (`#8E8A9A`) or stronger; `text-subtle` is never used for body copy.

## D-004 — Components come from React Bits only

**Choice.** `components.json` keeps one component registry, `@react-bits`. Aceternity
UI and Magic UI are not adopted.

**Why.** One registry means one source to review, one licence to track and one
install command. React Bits already covers what the site needs. Where the inspiration
board reached for another library, the need is met without it: the past-events
**timeline is built in-house** (it renders admin data, so it must follow our schema,
tokens and reduced-motion rules regardless of any library), and the "next event"
highlight uses React Bits' StarBorder in place of Border Beam. Two further sources
of copied code, neither vetted, buy a handful of effects.

**Changes.** No new registries. To add one later, record a new decision first.

## D-005 — Gallery: event photos and standalone club photos

**Choice.** The public gallery shows **both** the photos of events on the timeline
and standalone club photos uploaded directly to the gallery, together, grouped by
category.

**Why.** The spec says "all photos". Photos of an event belong with that event and
should appear in the gallery without a second upload; club life (a lab, a trip, a
team day) belongs to no event.

**Changes.** New `GalleryPhoto` entity (Redis + Blob), cache tag `gallery`, a shared
`Category` enum used by events and gallery photos, and a fifth admin tool,
`/admin/gallery`, built in Stage 7. The gallery page carries the `events` and
`gallery` tags. See `docs/ARCHITECTURE.md` and `src/lib/schemas/README.md`.

## D-006 — Contact and sponsorship are one page

**Choice.** `/contact` holds the contact details and the sponsorship/collaboration
form. There is no separate sponsor page.

**Changes.** None; this is the architecture already in place.

## D-007 — No stat counters on Home in v1

**Choice.** Home shows the hero, mission/vision/about and core team. It does not
show "members / events / projects" counters.

**Why.** The spec has no such section, and there is no data for one. Figures such as
"128 members" appear in the boards as placeholders and must not ship as facts. If the
club later wants counters, add a validated `stats` list to `src/content/site.json`.

**Changes.** The StarBorder effect proposed for these numbers is used on the
"Apply now" button and the current-event card instead.

## D-008 — No email: sponsorship requests live in the admin inbox

**Choice.** A sponsorship request is stored and read in `/admin/sponsorships`. There
is no email alert and no Resend integration.

**Why.** The spec says form responses go "directly" to the admin panel. Dropping
email removes a third-party account, a verified sending domain, three environment
variables and a failure mode.

**Trade-off.** Admins are not notified when a request arrives. The admin dashboard
shows a "new requests" count to compensate, and nothing is lost if nobody looks
for a while. If notification becomes important, it is one added step after the
request is stored, with no change to the data model.

**Changes.** Removed `RESEND_API_KEY`, `SPONSORSHIP_NOTIFY_EMAIL` and `EMAIL_FROM`;
removed the "Email" row from the stack. Turnstile, the honeypot and the rate limit
stay.

## D-009 — Rule 4 has no exceptions

**Choice.** Only `transform` and `opacity` animate (outside shader canvases). A
vendored component that animates anything else is rewritten or rejected.

**Why this came up.** The proposed hero-name effect, React Bits' **TrueFocus**,
animates CSS `filter: blur()` on the words _and_ animates the focus frame's `x`,
`y`, `width` and `height`. That breaks the rule twice. Rather than carve an
exception into a permanent rule, we build our own version with the same look:
non-focused words dim with `opacity`, and the frame moves with `transform`
(translate and scale) on a fixed-size element.

**Changes.** Stage 2 builds a `FocusText` primitive. TrueFocus is a visual
reference only.

## D-010 — One WebGL context in the hero; the name is real text at first paint

**Choice.**

1. The hero name is ordinary text in the page from the first paint. The intro plays
   around it, is skippable, and runs once per session. Content is readable within
   1.5 seconds.
2. The hero uses **one** WebGL context: the headset and the rings render in the same
   React Three Fiber canvas.

**Why.** The name is almost certainly the page's largest paint, so hiding it for
2.4 seconds costs Lighthouse points and contradicts the board's own 1.5-second
guardrail. And **MagicRings creates its own WebGL renderer**, so placing it beside
the headset canvas would spend the whole two-context budget on the hero alone.

**Changes.** Stage 2 either ports the MagicRings shader into the R3F scene, or, if
that is not practical, uses MagicRings as the hero object on its own and drops the
separate headset canvas. Either way there is one context.

## D-011 — No `ogl`, no second WebGL library

**Choice.** The project uses three.js through React Three Fiber and nothing else for
WebGL. The React Bits backgrounds built on `ogl` (Galaxy, Light Rays, Prism, Orb,
Dark Veil, Circular Gallery) are not used.

**Why.** A second WebGL runtime is dead weight against a 50 fps Android budget and a
lazy-loaded hero chunk. The same moods are achievable in the R3F scene. A future
exception needs a new decision.

## D-012 — Navigation: PillNav on desktop, StaggeredMenu on mobile

**Choice.** Desktop uses PillNav, patched to remove its `react-router-dom`
dependency in favour of `next/link` and `usePathname`. Mobile uses StaggeredMenu.
**Dock is dropped.**

**Why.** Dock's magnification is driven by hover, which has no touch equivalent, and
most recruitment traffic is on phones. Two navigation styles that cover the two
viewport classes are enough.

## D-013 — Component shortlist and rejections

Candidates are the components each page is expected to use. Every one is still
reviewed against the permanent rules (`CLAUDE.md` §3–4) when it is adopted.

| Page / role   | Candidates                                                      |
| ------------- | --------------------------------------------------------------- |
| Hero          | MagicRings (see D-010), our own `FocusText` (see D-009)         |
| Buttons, CTAs | StarBorder (Apply now, current event), Magnet                   |
| Team          | ProfileCard                                                     |
| Events        | SpotlightCard (timeline cards); the timeline itself is in-house |
| Gallery       | AccordionGallery (category filters), Masonry (photo grids)      |
| Navigation    | PillNav (desktop), StaggeredMenu (mobile)                       |
| Reveals       | our own `<Reveal>`, `<Stagger>` primitives                      |

**Rejected, with reasons**

| Component                                                   | Reason                                                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Lanyard                                                     | Needs a physics engine and `meshline`, plus `card.glb` and `lanyard.png` that the registry install does not include |
| Grid Scan                                                   | Bundles a face-detection library with optional webcam use; loads model files from a public CDN                      |
| Galaxy, Light Rays, Prism, Orb, Dark Veil, Circular Gallery | Depend on `ogl` (D-011)                                                                                             |
| Hyperspeed                                                  | Adds `postprocessing`                                                                                               |
| Dome Gallery                                                | Adds `@use-gesture/react`                                                                                           |
| Dock                                                        | Hover-only interaction (D-012)                                                                                      |
| Depth Carousel                                              | A second gallery intro is unnecessary once AccordionGallery covers the categories                                   |
| ScrollReveal, BlurText, GradientText, TrueFocus             | Animate `filter` or non-transform properties (D-009); replaced by our own primitives                                |
| Magic Bento, Model Viewer, Stepper, Logo Loop, Count Up     | Belong to pages or data the site does not have (projects, process steps, sponsor logos, counters)                   |
| All Aceternity UI and Magic UI components                   | Not adopted (D-004)                                                                                                 |

## D-014 — Repo stays private while vendored React Bits code is inside

**Choice.** The GitHub repository stays private for as long as React Bits components
are committed to it, unless the club confirms otherwise.

**Why.** React Bits is licensed **MIT + Commons Clause**: components may be used in a
website, but not sold, sublicensed or redistributed "alone, in a bundle, or as a
ported version". Publishing a repository that contains copies of the components
could be read as redistribution. This is a cautious reading, not legal advice.
Handover to the next committee should include the repository, not a public mirror.

## D-015 — Style Board colours adopted in Stage 2 ("tokens before hero")

**Choice.** The Style Board palette (base, silver text and the seven spectrum tokens,
with `text-subtle` at `#797F8D` per D-003) replaces the neutral Stage 1 colour values
now, in `globals.css`. Token names are unchanged; new ones were added (`void`,
`border-strong`, `text-body`, `subtle`, `silver`, `spectra-*`, `warning`), and
`accent` now points at `spectra-violet`. Fonts, the type scale, spacing, radii and
shadows stay Stage 3 work.

**Why.** The hero is built from its light: rings, horizon and headset are the spectrum.
Building them in a neutral blue and recolouring in Stage 3 would mean tuning every
glow twice. The palette was already decided (OPEN_ITEMS "Resolved"), so nothing is
being invented. The scene reads the tokens at runtime, so Stage 3 can still adjust any
value from one place.

**Changes.** `globals.css` values; `viewport.themeColor` mirrors `--color-bg`.

## D-016 — MagicRings is ported into the R3F scene

**Choice.** The first of the two options in D-010. MagicRings' fragment shader (its
`fade` and `ring` functions and pulsing ring cycle) lives on a plane inside the Orbit
Lab canvas. It is not installed as its own component.

**Why.** It keeps the headset, so the hero is still "one wireframe headset above an
ignited orbital ring" (D-001), on a single WebGL context. The port also moved the
shader from screen space to world space, so the rings can grow around the viewer
during the scroll-out. It drops the mouse, hover and click-burst inputs and the film
grain, which outlined the plane's square edge. Colours come from tokens. The orbit,
the guide rings, the left-to-right ignition and the 9-second satellite are new. The
ported code keeps its licence notice in `src/components/three/orbit-lab/shaders.ts`
(D-014).

## D-017 — The static hero still is an inline SVG drawn from tokens

**Choice.** The designed still is server-rendered SVG
(`src/components/sections/hero/hero-still.tsx`), not a WebP screenshot of the scene.

**Why.** It costs no request, recolours itself with the tokens (a WebP would go stale at
the first Stage 3 change), stays sharp at any size, and mirrors the scene's
responsive layout through CSS, so the canvas fades in over it with zero layout shift.
The same element is the static tier, the first paint for every tier, and the no-JS
render.

**Changes.** The Technical Plan's tier diagram now reads "inline SVG still" (PDF
regenerated).

## D-018 — Hero scroll-out: pinned on 3D tiers only, handing over dimmed

**Choice.** On the low and high tiers the hero pins for 150vh while the camera pushes in
toward the left lens, the rings grow and fade, and the text fades and lifts away. The
scene ends at 35% opacity rather than invisible, then scrolls off normally. The static
tier does not pin.

**Why.** Fading the scene to nothing left a full viewport of empty black after the pin
released. Pinning under reduced motion would add 150vh of scrolling with nothing
moving. The camera stops just in front of the lens rather than passing through it:
close up, the wireframe and particles turn into noise. "Transitions into the next
section's background" is finished in Stage 4, once that section exists.

## D-019 — Stage 3 additions: Lucide icons and one `cn()` helper

**Choice.** Three small runtime dependencies were added: `lucide-react` (icons),
and `clsx` + `tailwind-merge`, wrapped once as `cn()` in `src/lib/cn.ts`.

**Why.** The design brief specifies Lucide at a 1.5 stroke, and shadcn/ui (the
admin-only stack entry) uses all three, so Stage 6 would add them anyway. Having
one `cn()` now means the public UI and the admin share a single helper:
`components.json` points shadcn's `utils` alias at `@/lib/cn`, so `shadcn add`
never creates a second copy. `tailwind-merge` is taught the token names
(`text-display-xl`, `py-section`, `rounded-card`…), or it would drop a token
font size when it meets a colour class; a unit test checks every font-size
token in `globals.css` is known to it.

**Note.** Lucide v1 no longer ships brand icons (GitHub, LinkedIn, Instagram), so
social links are text links with an "opens in a new tab" cue.

## D-020 — Site shell: React Bits nav and effects rebuilt; header overlays the page

**Choice.** The D-013 shortlist items used in Stage 3 were read and rebuilt as
our own components, keeping each one's look and choreography:

| Source        | Ours                     | What changed                                                                                                                                             |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PillNav       | `site/pill-nav.tsx`      | `next/link` + `usePathname`; `width` load-in removed (rule 4); `menubar` roles removed; its mobile dropdown and spinning logo dropped; tokens            |
| StaggeredMenu | `site/mobile-menu.tsx`   | `color` tween removed (rule 4); closed panel `inert`; focus moves in, is trapped and returns; Escape; page inert and scroll-locked; closes on navigation |
| StarBorder    | `ui/button.tsx` (`star`) | Keyframes moved into `@theme` as tokens; colours from the spectrum                                                                                       |
| Magnet        | `motion/magnetic.tsx`    | No re-render per mouse move (direct transform per frame); mouse only; off under reduced motion                                                           |

The header is fixed and overlays the page. `<main>` is padded by the header
height unless the page opens with a `data-full-bleed` section (the home hero),
which runs underneath. PillNav shows from `lg` (1024px); below that the header
holds the logo, the Recruitment CTA (from `sm`) and the Menu toggle. Home is not
a pill: the logo links home.

Page transitions fade with opacity only — a transform on the page wrapper would
break the hero's fixed-position pin — and only on client navigations, never on
the first load, which must paint the hero name immediately (D-010).

**Why.** Each original broke at least one permanent rule or had an
accessibility gap (see the table). Rebuilding kept the look the club picked
while making the shell keyboard- and screen-reader-safe.

## D-021 — Logo: the original badge ships as raster; the pack's dark badge is rejected

**Choice.** The club's brand pack (`Stage_3_Vectorization`) resolves OPEN_ITEMS #2
with transparent-background PNGs. The site uses the **original badge** (black
roundel, white lettering) and the **mark with the white ring**, through
`next/image`. The pack's "dark" badge (`logo-dark`) is not used and was not
kept.

**Why.**

- The pack's SVGs wrap the same PNG (0.7–1.9 MB each); there are no vector
  paths. `next/image` serves a few-KB WebP/AVIF at the rendered size instead,
  from 768px (badge) and 256px (mark) copies in `src/assets/brand/`.
- The "dark" badge turned the black ring white but the lettering was already
  white, so "VIT PUNE · Reality Spectra" vanished (white on white). The original
  badge reads cleanly on `--color-bg` as it is.
- Full-resolution masters are kept in `references/brand/` for print and
  handover; the favicon and Apple icon are generated from the mark.

**Open.** A hand-drawn vector of the mark would sharpen the favicon at 16px; it
is a nice-to-have, not a blocker.

## D-022 — Rule 4 covers colour: no colour or background transitions

**Choice.** "Animate only `transform` and `opacity`" includes CSS transitions of
`color`, `background-color` and `border-color`. Hover colour changes are
instant; where a hover should feel animated, an overlay layer fades with
`opacity` (Button) or an element moves with `transform` (Card lift, PillNav).
The Stage 2 hero buttons that used `transition-colors` were replaced.

**Why.** The rule has no exceptions (D-009), and an exception for "just colour"
would be the first crack. Overlays give the same feel on the compositor.

**Also.** Form control borders use `--color-subtle`, the lightest neutral that
reaches WCAG's 3:1 for component boundaries on every surface; `--color-border`
(1.5:1) is for decorative hairlines only. A unit test audits every pairing the
design system uses.

## D-023 — Content layer in `src/content`; QR codes generated from the links

**Choice.** The club's approved copy (content brief, October 2026) lives in four
JSON files in `src/content` — `site.json`, `domains.json`, `contact.json` and the
interim `recruitment.json` — each validated by one Zod schema in
`src/lib/schemas/content.ts` and read through `src/lib/content.ts`.

- The loader parses every file when it loads, during `next build`, so a typo
  fails the build with the file and field named (demonstrated once, then
  reverted).
- It is `server-only`. Client components (header, mobile menu) receive plain
  props from the layout, so neither Zod nor the JSON is shipped to browsers.
- `src/lib/site.ts` keeps only structural constants (name, parent organisation,
  the sitemap). The Stage 1 `tagline`/`description` and the Stage 3
  `contactChannels` placeholder were removed — the content files are the only
  copy. `clubCredit` and `pageMetadata()` replaced hand-repeated strings and the
  per-page metadata block.
- QR codes (Instagram, WhatsApp community, application form) are **generated on
  the server from the stored link** with the `qrcode` library, rendered as one
  SVG path in token colours. A QR can therefore never point somewhere other
  than the link beside it, and changing a link updates its QR. They show from
  `md` up; phones get the buttons. The supplied QR PDFs were decoded to confirm
  the links; the Instagram share-tracking query (`?stkn=…`) was removed.

## D-024 — Interim recruitment, honest placeholders, no fake sponsorship form

**Choices (Arnav, Stage 4).**

1. **Interim recruitment now.** `src/content/recruitment.json` holds `open` and
   the Google Form link; the Recruitment page shows "Apply now" and a QR while
   open, and the header CTA shows an "open now" dot. Its shape matches the
   Stage 8 `RecruitmentSettings` record, which replaces it (admin-managed, plus
   the roles PDF) without changing the page.
2. **Placeholders for missing contact details**, the map included. A missing
   value is `null`, rendered as "Coming soon" text — never a fake link — and
   the map shows a placeholder panel. `pnpm check:launch` fails while any of
   email, phone, address or map link is still null, so placeholders cannot
   survive to go-live (Stage 10). Optional extras (LinkedIn, GitHub, a map
   embed) are simply hidden until set.
3. **The WhatsApp community link is public** on the site.
4. **Domains split** as confirmed: Technical — Training & Workshops, Web
   Development, XR Development; Non-technical — the other seven.

**Lead call.** The sponsorship request form needs its server action, Turnstile
and the admin inbox (Stage 8). Rather than ship a form that looks real but goes
nowhere, the Contact page shows an honest "opens soon" notice with the club's
channels; Stage 8 replaces it with the form.
