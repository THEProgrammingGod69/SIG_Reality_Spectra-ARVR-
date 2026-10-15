# Decision log

Product and design decisions made after the team review of the architecture
document, the SIG Style & Motion Board and the design inspiration board. Each
entry says what was decided, why, and what it changes. Add new decisions at the
bottom; never edit an old one — supersede it with a new entry.

**Decided by** is either _team_ (the club decided) or _lead_ (the club delegated
the call and it was made on the reasoning shown).

| ID    | Decision                                                                        | Decided by |
| ----- | ------------------------------------------------------------------------------- | ---------- |
| D-001 | Hero direction: **Orbit Lab**                                                   | lead       |
| D-002 | Fonts: **Space Grotesk · Inter · JetBrains Mono**                               | lead       |
| D-003 | Caption colour `text-subtle` is **`#797F8D`**                                   | team       |
| D-004 | Vendored components come from **React Bits only**                               | lead       |
| D-005 | Gallery shows **event photos and standalone club photos**                       | team       |
| D-006 | Contact and sponsorship are **one page**                                        | team       |
| D-007 | No stat counters on Home in v1                                                  | lead       |
| D-008 | No email: sponsorship requests live in the admin inbox                          | lead       |
| D-009 | Rule 4 has **no exceptions**; blur/layout-animating effects are rewritten       | lead       |
| D-010 | The hero has **one WebGL context**, and its name is real text at first paint    | lead       |
| D-011 | No `ogl`, no second WebGL library                                               | lead       |
| D-012 | Navigation: PillNav on desktop, StaggeredMenu on mobile                         | lead       |
| D-013 | Component shortlist and rejections                                              | lead       |
| D-014 | Repo stays private while vendored React Bits code is inside                     | lead       |
| D-015 | Style Board colours adopted in Stage 2 ("tokens before hero")                   | lead       |
| D-016 | MagicRings is ported into the R3F scene, not used as its own canvas             | lead       |
| D-017 | The static hero still is an inline SVG drawn from tokens, not a WebP            | lead       |
| D-018 | Hero scroll-out: pinned 150vh on 3D tiers only, handing over dimmed             | lead       |
| D-019 | Stage 3 additions: Lucide icons and one `cn()` helper                           | lead       |
| D-020 | Site shell: React Bits nav and effects rebuilt; header overlays the page        | lead       |
| D-021 | Logo: the original badge ships as raster; the pack's dark badge is rejected     | lead       |
| D-022 | Rule 4 covers colour: no colour or background transitions                       | lead       |
| D-023 | Content layer in `src/content`; QR codes generated from the links               | lead       |
| D-024 | Interim recruitment, honest placeholders, no fake sponsorship form              | team       |
| D-025 | Hosting on **Netlify**; files in **Cloudflare R2**; Upstash used directly       | team, lead |
| D-026 | Categories: hackathon · competition · workshop · other                          | team       |
| D-027 | Team: core + domain secretaries only; no team section on Home                   | team       |
| D-028 | Recruitment opens with the form alone; the roles PDF is optional                | team       |
| D-029 | Data layer: one generic repository over two storage ports                       | lead       |
| D-030 | Admin access: Auth.js beta pinned, development sign-in, reviewed shadcn subset  | team, lead |
| D-031 | Stage 7: local data mode, any-ratio images, placeholders until real content     | team, lead |
| D-032 | Stage 8: contact-form spam checks, recruitment moves to the admin panel         | lead       |
| D-033 | Stage 9: motion polish, performance, accessibility, security headers, analytics | lead       |
| D-034 | Stage 10a: nightly backup and orphan sweep, restore, WebKit tests, handbook     | lead       |
| D-035 | Final quality pass: Next.js security update, software-GPU detection, audits     | lead       |
| D-036 | `DATA_NAMESPACE` follows the Netlify deploy context when unset                  | lead       |
| D-037 | Premium pass: React Bits effects rebuilt, the lab on every page                 | lead       |
| D-038 | The XR HUD: a motion language of its own, on every page                         | lead       |
| D-039 | Club archive, password sign-in, footer admin link, Netlify Blobs                | team       |

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

> **Superseded by D-038** (the HUD rail on desktop, the aperture menu on
> mobile). Dock stays dropped, for the reason below.

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

## D-025 — Hosting on Netlify; files in Cloudflare R2; Upstash used directly

**Choice (Arnav, Stage 5).** The site is deployed on **Netlify**, not Vercel.
The locked stack (CLAUDE.md §2) assumed Vercel in four places; each is replaced:

| Was (Vercel)                         | Now                                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Upstash added via Vercel Marketplace | **Upstash Redis, created directly** at upstash.com; same client, same REST variables             |
| Vercel Blob                          | **Cloudflare R2** (lead call, below)                                                             |
| Vercel Cron                          | A **Netlify scheduled function** calling the nightly job with `CRON_SECRET` (Stage 10)           |
| Vercel Analytics                     | Re-decided in Stage 9 (it does not run off Vercel); nothing was installed, so nothing is removed |

**Lead call: R2 over Netlify Blobs.** Netlify Blobs has no presigned browser
uploads, so every photo would pass through a function, whose request body is
capped at about 6 MB — that breaks rule 11 and fails on full-size phone photos.
R2 is S3-compatible, gives presigned PUT URLs, has a free tier (10 GB, no
egress fees) and serves files publicly from an r2.dev URL or a custom domain.
Requests are signed with `aws4fetch` (a few KB, fetch-based) instead of the
full AWS SDK. A presigned PUT cannot cap a file's size, so the size and type
are checked again when the file is attached to a record, and a bad upload is
deleted then (D-029).

**Caching on Netlify.** Netlify's Next.js runtime lists Cache Components as
fully supported, so the design is unchanged: `'use cache'` + `cacheTag` on
public reads, `updateTag` from Server Actions. To be confirmed on the first
real deploy (OPEN_ITEMS #26): an admin save must show on the public page at
the next reload, from any instance.

**One namespace for both stores.** `REDIS_KEY_PREFIX` became
`DATA_NAMESPACE`, which prefixes Redis keys (`sig:{ns}:…`) **and** R2 objects
(`{ns}/…`), so production, previews and tests can share one database and one
bucket. Netlify sets `CONTEXT` on every build; `src/lib/env.ts` fails a deploy
whose namespace does not match it (production must be `prod`, nothing else
may be).

## D-026 — Categories: hackathon · competition · workshop · other

**Choice (Arnav, Stage 5).** The club runs mostly hackathons and competitions,
plus workshops; everything else shares one catch-all, **Other**. Meetups and
talks are not separate categories. Events and standalone gallery photos share
the list (`src/lib/schemas/category.ts`), in that order. Adding a category
later is one line.

## D-027 — Team: core + domain secretaries only; no team section on Home

**Choice (Arnav, Stage 5).**

1. The public hierarchy has **two tiers**: the **core team** (six
   office-bearers: President, Vice President, …) and the **secretaries**, one
   per domain, each tied to a domain id from `domains.json`.
2. **Coordinators and volunteers are not stored or shown**, and there is no
   faculty advisor on the site.
3. **The home page has no team section**; the team appears on About only.
   This supersedes the "core members also appear on the home page" line of
   CLAUDE.md §1 and the `isCore` flag planned in the schemas README: with
   nothing else singling out core members, the tier says it.

Secretaries are listed in the order of the domains they lead; core members in
the admin's drag order.

## D-028 — Recruitment opens with the form alone; the roles PDF is optional

**Choice (Arnav, Stage 5).** The roles-and-responsibilities PDF does not exist
yet. Recruitment can be **open with only the Google Form link**; while no PDF
is uploaded, the Recruitment page says "The roles and responsibilities document
is coming soon" in place of the download button (rule 9, D-024: never a dead
link). The earlier rule "recruitment can only be opened when both are set" is
dropped.

**Lead call.** `src/content/recruitment.json` is now validated by
`RecruitmentInputSchema`, the admin-managed record's own input schema, and the
separate `InterimRecruitment` schema was deleted — one schema, as rule 3 asks.
`pnpm seed` copies the file into Redis when no admin has saved settings yet,
so Stage 8 only switches the page to `getRecruitment()` and deletes the file.

## D-029 — Data layer: one generic repository over two storage ports

**Choice (lead, Stage 5).** How `src/lib/data` is built, so later stages and
a future Postgres move have one design to follow:

- **Two ports** (`adapters/types.ts`): a `RecordStore` (Redis today) and an
  `ObjectStorage` (R2 today), each with an in-memory version and one contract
  test suite every implementation must pass. Replacing Redis means writing one
  adapter, not touching repositories or UI.
- **One generic repository** (`entity.ts`) holds every rule once: validate on
  write and on read (corrupt records are logged and skipped), optimistic
  concurrency on `updatedAt`, verify newly attached files, delete files a
  record stopped using, refresh the entity's cache tags. Each entity file only
  declares its schema, files, score and extra checks.
- **Atomic writes by Lua script, not MULTI.** Upstash's REST API has no
  WATCH, so MULTI cannot check a version before writing. One script checks
  every version and then writes every record and index entry, so a stale edit
  is refused and an index can never drift from its records.
- **Records are Redis hashes** (`data` JSON + `version`) so the script reads
  the version without parsing JSON; each collection has one sorted-set index.
- **Ids are generated in the browser** (UUID) for admin-managed records, so a
  file can be uploaded under its record before the record is first saved.
  Sponsorship requests get a server-side id.
- **Event phases** (draft · current · awaiting · timeline) are computed per
  request. An event without an end time runs to the end of its start day in
  India Standard Time.
- **Public reads** are `'use cache'` with `cacheLife('hours')`: admin saves
  refresh them at once through `updateTag`; the lifetime only bounds changes
  made outside the panel (the seed script, a manual fix).
- **The upload route fails closed** until Stage 6: `getAdminSession()` is a
  stub that always returns null, and the route also refuses cross-site
  requests. Public reads never include `updatedBy` (an admin's email).

## D-030 — Admin access: Auth.js beta pinned, development sign-in, reviewed shadcn subset

**Choices (Arnav, Stage 6).** The club's Google account is not available yet,
so Stage 6 is built with **placeholder credentials**: Google sign-in is fully
built and switches on when `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` are set, and
the **temporary admin is `dryerisdry@gmail.com`** until the club's accounts
replace it (OPEN_ITEMS swap list). To use the panel meanwhile, a
**development sign-in** (option 1 of three offered) signs in as an
allowlisted email without a password.

**Lead calls.**

- **Auth.js is `next-auth@5.0.0-beta.32`, pinned exactly.** v5 has no stable
  release; it is the version that supports the App Router and Next 16 and the
  one the Auth.js docs describe. Pinning stops an unreviewed beta update.
  Upgrade deliberately, re-running the admin e2e suite.
- **The development sign-in cannot reach a deployed site.** It exists only
  under `next dev` or with `AUTH_DEV_SIGN_IN=true`, never where Netlify sets
  `CONTEXT`; `env.ts` fails a Netlify build that sets the flag; a session made
  by it is rejected wherever it is disabled; it still checks the allowlist.
  The e2e suite uses it (CI sets the flag for the production-build run).
- **The allowlist is re-checked on every request**, not only at sign-in, so
  removing an address from `ADMIN_EMAILS` locks that admin out at once. Google
  sign-ins also need a verified email.
- **Three locks** (rule 8): `proxy.ts` redirects signed-out visitors to
  `/admin/login` (remembering the page, but only ever returning to an
  `/admin` path — no open redirect), the panel layout checks again, and every
  Server Action goes through `adminAction()`.
- **One action result.** `adminAction()` re-checks the session and turns the
  data layer's errors into an `ActionResult` (`src/lib/action-result.ts`) the
  forms and toasts read the same way: per-field issues, "changed by someone
  else", "sign in again".
- **shadcn subset, reviewed.** Button, Badge, Card, Input, Label, Separator,
  Sheet and AlertDialog, rewritten to our rules: imports from `@/lib/cn` (the
  CLI had added an unrelated npm package named `cn`, removed), no colour
  transitions (D-022), and no tw-animate-css entrances (not installed, so
  sheets and dialogs open instantly; Stage 9 may add transform/opacity ones).
  shadcn's colour names (`background`, `primary`, …) are aliases of our
  tokens in `globals.css`; `accent` and `muted` are not, because our tokens
  already use those names. Skeleton and EmptyState come from the public UI.
- **Toasts are built in-house** (Motion, transform/opacity) because sonner
  animates `height` (rule 4). Errors stay until dismissed.
- **Unsaved-changes guard**: forms register with `useUnsavedChanges(isDirty)`;
  the browser warns on close/reload, and the panel's links and sign-out ask
  first (Next.js cannot block a client navigation, so the panel's own
  navigation goes through `GuardedLink`).
- **Setup checklist on the dashboard** (`src/lib/integrations.ts`) lists every
  outside service and whether its credentials are set, so placeholders stay
  visible until they are replaced.

## D-031 — Stage 7: local data mode, any-ratio images, placeholders until real content

**Choices (Arnav, Stage 7).** The club's accounts are still unavailable
(Upstash, R2 — swap list in OPEN_ITEMS), the event details are not final, and
the drive of photos is unsorted and comes in many ratios and sizes. So Stage 7
is built and tested on placeholders: demo events and photos from
`pnpm seed --demo`, and the recruitment form link standing in as the sample
registration link.

**Lead calls.**

- **Local data mode.** `DATA_BACKEND=local` keeps records in
  `.data/records-{namespace}.json` and files in `.data/media` (gitignored),
  served by `/api/local-media/[...key]`. Uploads use the same flow as R2: an
  HMAC-signed, expiring PUT URL (signed with `AUTH_SECRET`), verified on attach.
  The file store is the in-memory store loaded from the file, with writes
  queued so parallel saves cannot lose records; it passes the same contract
  tests as Upstash. It is for one developer's computer only: `env.ts` fails any
  Netlify deploy that sets it, and switching to Upstash + R2 is only a change of
  variables. Media URLs may therefore be an R2 https URL or a
  `/api/local-media/…` path (`mediaUrl` in `schemas/fields.ts`).
- **Images of any ratio** (OPEN_ITEMS #17 resolved). There is no locked crop:
  posters are shown whole (`object-contain`) in a fixed 4:5 frame, so a poster
  of any shape never breaks the card grid (rule 9); gallery and timeline photos
  are square, centre-cropped tiles, and the viewer shows each photo whole.
  The uploader converts every image to WebP in the browser, long edge ≤ 2400 px.
- **Plain-text descriptions and recaps.** Markdown would need a renderer that
  is not in the locked stack; text is shown as paragraphs (blank line = new
  paragraph), never as HTML, so nothing an admin types can inject markup.
- **In-house native select and checkbox** for the admin forms (the platform's
  own pickers are the most accessible on phones); textarea follows shadcn.
- **Forms render their saved values on the server** (`inputProps()`), so a
  form is never empty before its JavaScript loads.
- **Admin reads go through `adminRead()`**, which shows "data store not
  connected" or "could not reach the data store" instead of an error page;
  public reads return their empty states where no store is configured.
- **E2E runs use at most 4 parallel browsers locally**: one dev server cannot
  serve more once the pages carry many images.

## D-032 — Stage 8: contact-form spam checks, recruitment moves to the admin panel

**Context.** Stage 8 connects the last three admin tools to the site: the
team (About), the recruitment settings (Recruitment and the header) and the
sponsorship inbox (the form on Contact). The team list, the roles PDF and the
Turnstile keys are still to come (OPEN_ITEMS #19, #20, #22), so the stage is
built and tested on placeholders, as in D-031.

**Lead calls.**

- **Three spam checks on the public form**, in this order in the Server
  Action: a **honeypot** field people never see (a bot that fills it is told
  it worked and nothing is stored); **Cloudflare Turnstile**; then
  **validation and a rate limit** of 3 requests per sender per hour in the
  data layer, counted only for valid requests. The limit is a short-lived
  counter on the `RecordStore` port (`hit()`: an atomic INCR + EXPIRE script
  on Upstash, `sig:{ns}:ratelimit:*`; in memory for local mode and tests),
  keyed by a hash of the sender's address, so no IP address is stored. On
  Netlify the address comes from `x-nf-client-connection-ip`, which Netlify
  sets and a visitor cannot forge.
- **Turnstile fails closed.** With both keys it is on; with neither, it is off
  only off Netlify (a developer's computer, the tests); a Netlify deploy
  without both keys, or any environment with just one, does not offer the
  form — Contact shows the club's channels instead, as D-024 required of a
  form that cannot work. The same rule hides the form where no data store is
  configured. Cloudflare's script loads only on /contact, only with the keys.
- **Recruitment lives in the admin panel now.** `src/content/recruitment.json`
  and `interimRecruitment` are deleted; /recruitment, the header's
  Recruitment button and the mobile menu read the cached settings
  (`recruitment` tag). Until an admin first saves them the site shows
  recruitment closed — so going live includes opening it in
  /admin/recruitment with the club's form link (OPEN_ITEMS swap list).
  `pnpm seed` now only adds demo content (`--demo`), which opens recruitment
  with that link in a development namespace.
- **No site-wide recruitment banner.** The Stage 3 slot is removed rather than
  filled: a bar above the fixed header would push every page, the full-bleed
  hero and the skip link's focus order around, and the status is already
  shown where people look — the header's button (a dot and "open now" for
  screen readers) and, on phones where that button is hidden, an "Open now"
  tag beside Recruitment in the menu.
- **Team ordering.** New members join the end of their tier. The core team is
  reordered with up/down buttons, each move saving the whole order atomically
  (`team.reorder()`); secretaries follow the order of the domains they lead,
  so they need no ordering. Cards show a square, centre-cropped photo, or the
  member's initials.
- **The inbox** lists requests newest first, 20 a page; new ones open by
  default. A status change saves at once; deletes ask first. There is still no
  email (D-008): the inbox links the sender's address and phone for a reply.
- **Shared pieces instead of copies:** `ConfirmDelete`, `SaveBar`,
  `useRecordVersion` (the `updatedAt` a form sends, and the conflict notice),
  `CheckboxField` and `PdfField` in the admin; `publicRead()` + `LoadFailed`
  for every public read; `blankToNull` in `src/lib/forms.ts` for both sides.
  The Stage 7 screens were moved onto them.
- **Local data mode's write queue is process-wide.** The development server
  can load the data layer once per bundle; two copies writing `.data` at once
  could lose a write. The queue (and the counters) now live per file on
  `globalThis`, with a test for two store copies.
- **Sign-out is final; sessions do not roll.** Auth.js re-issues the session
  cookie on every request the proxy reads it on. With Stage 8's link-heavy
  admin pages, Next.js prefetches in flight when "Sign out" is pressed could
  arrive afterwards and put the session back (the production-build e2e run
  caught it). The proxy now passes on cookie removals only
  (`cookieRemovalsOnly()` in `src/lib/auth/policy.ts`), so a session lasts a
  fixed 8 hours from sign-in, as D-030 describes, and signing out sticks.

## D-033 — Stage 9: motion polish, performance, accessibility, security headers, analytics

**Context.** Stage 9 hardens what Stages 1–8 built before go-live. Arnav
approved the defaults proposed in the Stage 9 brief: Cloudflare Web Analytics
with a placeholder token, and `@axe-core/playwright` as a dev dependency.

**Lead calls.**

- **Motion.** The admin's Radix sheet and dialogs now enter and leave with
  keyframe tokens in globals.css (`animate-fade-*`, `-rise-*`, `-slide-*`):
  transform and opacity only, on the duration tokens, so reduced motion makes
  them instant. Keyframes rather than transitions, because Radix keeps a
  closing overlay mounted exactly until its exit animation ends. The backdrop
  class lives once (`admin/ui/overlay.ts`). New **`<Tilt>`** primitive (our
  TiltedCard, on Magnetic's rules: mouse only, a 4° lean, off under reduced
  motion) on About's team cards; the team, current events and contact form
  enter with `<Reveal>`/`<Stagger>` like the other sections.
- **The page fade is CSS.** `PageTransition` used Motion for one opacity fade,
  which put the 44 KB library on every page; it is the `animate-fade-in` token
  now. Motion loads only for the hero title (Home) and admin toasts.
- **No schema module in public client code.** A client component that imports
  a schema file pulls all of zod into the browser (its top-level `z.*` calls
  cannot be tree-shaken): /gallery paid 89 KB for a list of categories. Client
  components receive such constants as props (`GalleryBrowser` gets
  `categories`, `SponsorshipForm` gets `types`), and the contact form loads
  zod and its schema on first focus, not with the page — still the one shared
  schema (rule 3). /gallery 353 → 264 KB, /contact 369 → 278 KB of JavaScript.
- **Images.** `sizes` match the real grid columns (phones get full-width tiles,
  not half-width ones); the first gallery tile is preloaded as the page's
  largest paint; the photo viewer loads its photo eagerly.
- **Software WebGL gets the static hero.** A WebGL context requested with
  `failIfMajorPerformanceCaveat` is refused when the browser would draw it on
  the CPU (no GPU, a blocked driver, headless browsers). Such devices now get
  the designed still (D-017) instead of a scene that costs every frame in
  main-thread time. The production e2e run therefore sees the static tier; the
  dev run still exercises the 3D intro through `?hero-tier=low`.
- **Measured, not guessed.** Lighthouse (mobile, throttled) on the production
  build: Accessibility, Best Practices and SEO 100 on every page; Performance
  91–93 on the content pages. Home is ~60 in the lab because the headless
  browser has no GPU; real throttled runs paint the largest element at first
  paint (~1.1 s). The Android 50 fps sign-off (OPEN_ITEMS #1) still needs a
  real phone.
- **Accessibility.** `tests/e2e/a11y.spec.ts` runs axe-core (WCAG 2.2 A/AA) on
  every public page, the open phone menu, the photo viewer, the contact form
  with errors, the sign-in page, every admin screen and a delete dialog, plus
  the contact form's keyboard order. It found one issue, fixed: Contact's
  details list nested its `dt`/`dd` pairs too deep.
- **Security headers** (`src/lib/security-headers.ts`, applied in
  next.config.ts): a CSP allowing scripts only from the site, Turnstile and the
  analytics beacon; connections to the site, the account's R2 upload endpoint
  and the analytics report; frames for Turnstile and a Google Maps embed;
  `object-src`/`frame-ancestors 'none'`, `base-uri`/`form-action 'self'`.
  `'unsafe-inline'` stays for scripts and styles: a nonce would make every
  prerendered page dynamic. Plus HSTS (https only), `nosniff`, `DENY` framing,
  a strict referrer policy, a Permissions-Policy that turns off camera,
  microphone, location, payment and USB (WebXR stays allowed for the club's
  own pages), COOP, and `X-Robots-Tag: noindex` on /admin and /api. An e2e
  test fails on any CSP violation across every public and admin page.
- **Analytics: Cloudflare Web Analytics.** Free, cookieless (no consent
  banner), and the club already uses Cloudflare for R2 and Turnstile. Loads
  only on the public site, only with `NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN`, never
  under `next dev`; listed on the dashboard's Setup card.
- **SEO.** Each page gets its own 1200×630 share image (`/og/[page]`,
  prerendered at build) in Space Grotesk on the brand palette; the static TTFs
  (OFL) are in `src/assets/fonts`, server-only, since the renderer cannot read
  WOFF2. Colours come from `src/lib/token-values.ts`, mirrored tokens a unit
  test keeps equal to globals.css (the browser theme colour moved there too).
  /events adds schema.org Event data for its current events; JSON-LD renders
  through one `<JsonLd>` component.

## D-034 — Stage 10a: nightly backup and orphan sweep, restore, WebKit tests, handbook

**Context.** Stage 10 is split (Arnav's call): **10a** builds everything that
does not need the club's accounts; **10b** is the go-live in one sitting when
they arrive, following [`GO_LIVE.md`](./GO_LIVE.md).

**Lead calls.**

- **The nightly job** is `POST /api/cron/nightly`, accepted only with
  `Authorization: Bearer $CRON_SECRET` (constant-time check, `isBearer()`),
  called by a Netlify scheduled function (`netlify/functions/nightly.mts`) at
  21:00 UTC — 02:30 in India. POST, so no crawler or prefetch can trigger it.
  Netlify runs schedules only on the published production deploy.
- **Backup first, sweep second.** A failed backup stops the job, so files are
  only ever deleted on a night whose records are safely backed up. A backup is
  every record of every collection, as stored — valid or not — in one JSON file
  in the file storage, `{ns}/backups/{yyyy-mm-dd}.json` dated in club time; the
  newest 30 are kept. Photos are not copied: R2 keeps them, and a deleted
  record's files survive the 24-hour grace below, which is the window to
  restore an event with its photos.
- **The orphan sweep** deletes files no record mentions once they are older
  than 24 hours (so an admin's unsaved upload is safe). It matches files by
  storage key from the namespace on, not by full URL, so moving the media to a
  new domain can never make every file look unused; a file whose age is unknown
  is kept; backups are never swept; and a sweep that would delete more than half
  of the files (and at least 10) is refused as a sign of misconfiguration.
- **Restore** puts a backup's records back exactly as they were (their own
  dates, versions and authors, no new file checks), in batches of 25 atomic
  writes; records missing from the backup are left alone. It runs from a
  computer: `pnpm data restore <date>` reports first and changes nothing without
  `--yes`, and the production namespace also needs `--production`.
  `pnpm data backups | backup | sweep [--dry-run]` round out the tools.
- **Ports.** `ObjectStorage` gains `get(key)` (reading a backup back) and
  `lastModified` in `head()` (the sweep's age check), on R2, local files and
  memory. The generic entity gains `maintenance.exportAll()` and
  `maintenance.restore()`, so every repository has them with no per-entity
  code; `createMaintenance()` (src/lib/data/maintenance.ts) works over them.
- **Mobile WebKit** (iPhone 14 profile) runs the public specs beside Chromium;
  the admin panel, used on laptops, stays on Chromium. It found a real bug:
  the contact form's default values were written into its inputs when
  react-hook-form attached after hydration, wiping anything a visitor on a slow
  phone had already typed. The public form now has no default values, so each
  field starts from what its input holds.
- **Testing a deployed site**: `PLAYWRIGHT_BASE_URL=… pnpm test:deployed` runs
  the public specs against a deploy preview or production without starting a
  server; tests that need the development sign-in skip themselves there.
- **Handover** is a plain-language handbook (`docs/handbook/`) for coordinators
  — events, gallery, team, recruitment, sponsorships — plus admins, backups and
  the yearly handover checklist for whoever looks after the site.

## D-035 — Final quality pass: Next.js security update, software-GPU detection, audits

**Context.** After Stage 10a, a full quality pass over the finished site:
dependency audit, Lighthouse (mobile and desktop) on the production build,
a crawl of every link, and full-page screenshots at phone and desktop width.

**Findings and calls.**

- **Next.js 16.3.5 → 16.3.8** (and `eslint-config-next`). The audit reported a
  critical advisory, GHSA-vcvr-r3jv-pc5j: remote code execution in
  `next/og`'s ImageResponse, which the share images use. They are drawn at
  build time from fixed content, never from a visitor's input, so exposure was
  low, but the fix is a patch release in the same line. Every test was re-run
  on it. The one remaining audit warning, `braces` under ESLint's tooling, is
  development-only, never runs on the site, and has no patched version.
- **Software GPUs are recognised by name too.** Modern headless Chrome draws
  WebGL through ANGLE + SwiftShader without tripping
  `failIfMajorPerformanceCaveat`, so the hero still ran its 3D scene on the CPU
  there (Home: Lighthouse mobile 65, 1.2 s blocking). The tier now also reads
  the renderer's name (`WEBGL_debug_renderer_info`): SwiftShader, llvmpipe,
  softpipe and Microsoft Basic Render get the static still. Home: **92**, 30 ms.
- **Gallery batches of 30**, not 24: whole rows at 1, 2, 3, 5 and 6 columns.
- **Results** on the production build: Lighthouse desktop 99–100 on every
  page, mobile 90–93, Accessibility / Best Practices / SEO 100 everywhere;
  86 internal URLs all answer 200, and the Instagram, WhatsApp and Google Form
  links are live; no page scrolls sideways at 390 px or 1440 px.

---

## D-036 — `DATA_NAMESPACE` follows the Netlify deploy context when unset

**Context.** The first Netlify production deploy failed: the env guard (D-025)
requires `DATA_NAMESPACE="prod"` in production, and an unset variable fell
back to `dev`. The guard did its job, but the fix asked of whoever deploys
was one more variable to set per context, with nothing gained by typing it.

**Decision.** Left unset, the namespace is derived from Netlify's `CONTEXT`:
`prod` for production, `preview` for deploy previews and branch deploys,
`dev` off Netlify (local, tests). An explicit value is still checked exactly
as before, so a wrongly scoped variable (`prod` on a preview, anything else
in production) still fails the build. The safety property is unchanged:
previews can never write live data and production never runs on a test copy.

**Consequence.** A fresh Netlify site builds with no variables at all. Until
Upstash, R2, Google sign-in and Turnstile are set it is an honest shell: the
data sections show their "could not load" state, the contact form is
replaced by the channels list, and `/admin` cannot be signed into.

## D-037 — Premium pass: React Bits effects rebuilt, the lab on every page

**Context.** After Stage 10a a premium pass was requested: more motion and
a stronger sense of place on every page, with React Bits as the inspiration.
Its site, reactbits.dev, is not reachable from the build environment, so the
components were read from React Bits' public GitHub repository instead.
The permanent rules were kept exactly: nothing here is an exception to rule 4
(D-009) or to the React Bits review rules (CLAUDE.md §12).

**What was rebuilt from React Bits, and how it differs.**

| React Bits     | Ours                                     | What changed                                                                                                                                                         |
| -------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SplitText      | `motion/split-text.tsx`                  | No GSAP SplitText plugin: words are real text in line masks, rising by `transform` only. `play="load"` is pure CSS (page titles); `play="scroll"` uses ScrollTrigger |
| ScrollReveal   | `motion/scroll-words.tsx`                | `filter: blur()` dropped; `opacity` only; scrubbed by scroll; reverts only its own tween (ScrollReveal killed every ScrollTrigger)                                   |
| SpotlightCard  | `motion/spotlight.tsx`, `Card spotlight` | Repainted a `radial-gradient` background per move; ours moves fixed-size lights with `transform`, fades with `opacity`; mouse only; adds a rim light on the edge     |
| ScrollVelocity | `motion/marquee.tsx`                     | Scrubbed by the scroll position (`xPercent`), not a velocity-driven per-frame loop: nothing moves while the page is still (WCAG 2.2.2); still under reduced motion   |
| GlareHover     | `Button` primary glare                   | A skewed band moved with `transform` behind the label, instead of an animated `background-position`                                                                  |

**New in-house pieces.** `ScrollProgress` (header hairline, `scaleX`),
`TimelineRail` (the events rail fills with `scaleY`, markers light with
opacity/scale), `LabBackdrop` (grid floor, violet light, orbit rings — the hero
motif on every page intro, the Home call to action, the map placeholder and the
404), `FilmGrain` (a static noise tile from `md` up), `Viewfinder` (corner
brackets around QR codes), `SectionHeading` (eyebrow + rising title + lead +
action, one pattern for every section), `DomainTicker` and `HomeCta` on Home.

**Lead calls.**

- **Page titles rise in CSS, not JavaScript.** `SplitText play="load"` and the
  `animate-intro-in` lead are keyframes that run from the first paint and on
  every client navigation (the template remounts the page). Words are clipped by
  their mask rather than faded, and the lead fades from the first frame with no
  delay, so the largest paint is not held back. The hero name is untouched: it
  keeps D-010.
- **Delays are stagger multiples.** Every CSS delay is
  `calc(var(--stagger) * n)`, so it collapses with the stagger under reduced
  motion, where the global rule also ends every animation at once.
- **Trigger points the reader can reach** (`lib/motion/scroll-point.ts`). A
  `'top 85%'` start near the end of a short page can lie past the furthest the
  page scrolls; the footer wordmark on a phone never appeared. Every
  ScrollTrigger start/end in the motion primitives is now a scroll position
  clamped to the page's maximum scroll. This also fixes the same latent issue
  for `<Reveal>` and `<Stagger>`.
- **Triggers are re-measured when the page changes under them**
  (`motion/scroll-refresh.tsx`, in the site layout). ScrollTrigger measures on
  load and resize only, but the footer's triggers outlive a client navigation
  and Suspense sections stream in after the shell; either could leave a trigger
  starting past the new page's end. `ScrollRefresh` re-measures after every
  route change and whenever the document's height settles at a new value.
- **Nothing on screen at load flashes**: timeline markers already in view when
  the rail arms stay lit; only those below the fold wait for the reader.
- **Marquee copies always outrun the band**: short lists repeat within each
  copy (`minItems`) and a copy is at least a screen wide, so the band never
  shows an empty stretch, even on a very wide display.
- **Nothing moves on its own for more than 5 seconds (WCAG 2.2.2).** The
  domain ticker first ran as an endless CSS loop, which needs a pause control;
  it is scroll-linked instead (as React Bits' ScrollVelocity is), so it moves
  only while the reader scrolls. The backdrop's rings and light settle into
  place once as a page opens (`--dur-settle`, 4.8 s), and the recruitment
  status light and the hero's scroll cue play twice, then rest. (The Stage 3
  StarBorder on "Apply now" and the hero scene are older and unchanged.)
- **The hero pin is measured first** (`refreshPriority: 1`). It is created
  once the device tier is known — after every other trigger on Home — but its
  150vh of spacing moves all of them; refreshed last, every Home entrance
  fired about 150vh early for visitors who get the 3D hero, off screen.
- **Only the upper end of a trigger point is clamped**: a point already
  passed, or a page that no longer scrolls (a taller window), fires on the
  next refresh instead of leaving content hidden.
- **Contrast in every state.** The hollow numerals' stroke is the caption
  colour (axe counts a stroke of 0.03em or more as the text colour, and phone
  sizes reach it); a ScrollWords word waiting to be read is at 45% (≥ 3.9:1 for
  its large type, even on the violet glow), and a paragraph seen whole is fully
  lit; the spotlight is softer (10%) and captions inside lit cards use the muted
  tone; the map placeholder's text is body tone over the backdrop's light.
- **`HashTarget` tolerates a mangled link** (`#%` no longer throws) and clears
  the mark when a same-page navigation drops the fragment (Navigation API's
  `currententrychange`, where available).
- **`:target` after a client navigation** (`site/hash-target.tsx`): Next.js
  navigates with `pushState`, which never sets `:target`, so `HashTarget`
  marks the element the fragment names with `data-targeted`.
- **Inner page intros run under the header** (`data-full-bleed`, as the hero
  does), so their backdrop reaches the top of the screen.
- **Home** gains the domain ticker (decorative, `aria-hidden`: the overview
  below lists every domain as linked text), and each domain name links to its
  card on /recruitment, which is outlined on arrival. The closing call to action
  says nothing about whether recruitment is open, so it is never wrong.
- **Events**: the soonest event spans the row from `lg` (poster beside its
  details), so one event no longer sits alone in a third of the row.
- **Gallery**: the newest photo leads as a double tile from `md`
  (`grid-flow-dense`, still square, D-031). Tiles enter after a filter change or
  "Show more" only; the first load shows every tile at once (the first tile is
  still the preloaded largest paint). Captions rise on hover and keyboard focus
  and are `aria-hidden` (the button is named by the photo's alt text). The
  lead tile takes four cells, so the first batch is 27 photos (D-035's 30
  cells), keeping whole rows at 3, 5 and 6 columns; later batches stay 30.
- **New tokens** in `globals.css`: `--text-display-3xl`, `--grid-cell`,
  `--spotlight-size`, `--grain-strength`, `--z-grain`, `--dur-settle`,
  `--motion-word-drop`, `--motion-word-tilt`, `--motion-dim`, the keyframe
  tokens `animate-word-rise`, `-intro-in`, `-enter`, `-orbit`, `-ping-soft`,
  `-scroll-cue`, `-drift`, and the
  static utilities `word-mask`, `text-spectra`, `text-outline`, `bg-lab-grid`,
  `bg-grain`, `mask-rim`.

**Not done, on purpose.** No new pages (the six-page sitemap is the
contract), no stat counters (D-007), no text scramble/decrypt effects (they
change text every frame), no custom cursor, no second WebGL context, and no
new dependency.

## D-038 — The XR HUD: a motion language of its own, on every page

**Context.** After D-037 the club asked for far more motion, and for it to stop
looking like every other site: "generic animations and a generic navigation
bar". The brief stays the club's own — _cinematic, realistic XR lab, not gaming
neon_ — so the answer is one idea carried everywhere, not a pile of effects:
**the site seen through the lab's headset.** A heads-up display marks what is
in reach with corner brackets that lock on, readouts decode as they come
online, a line of light scans a scene once, pages change behind a shutter, and
the lab has depth that answers the scroll. The club's Instagram
(`@sig_realityspectra`) could not be read — it shows only a login wall to
tools, through a scraper too — so the tone comes from the club's existing copy
and VIT's public description of the club (an AR/VR hub for immersive R&D).
Every permanent rule holds exactly as before; nothing here is an exception to
rule 4 (D-009), and React Bits remains the only source (D-004).

**What was rebuilt from React Bits, and how it differs.**

| React Bits              | Ours                                       | What changed                                                                                                                                                                                                    |
| ----------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DecryptedText           | `motion/decode-text.tsx`                   | The real text never leaves the DOM (made transparent while a decode runs); glyphs play in an `aria-hidden` copy over it, written directly, no re-render per frame; once per trigger; never under reduced motion |
| TargetCursor            | `site/reticle-cursor.tsx`                  | Keeps the system cursor; no endless spin (WCAG 2.2.2); corners eased toward their goal on `--dur-micro` and the loop stops when they arrive; mouse only; never under reduced motion                             |
| ScrollFloat             | `motion/scroll-float.tsx`                  | Same pose (below, stretched tall and narrow); scrubbed between reachable trigger points; decorative only (the footer wordmark)                                                                                  |
| ScrollStack             | `motion/stack.tsx`                         | CSS `position: sticky` does the stacking; one scrubbed tween per panel on the site's ScrollTrigger instead of its own per-frame loop and Lenis instance; a scrim darkens the panel behind (opacity, not filter) |
| ProfileCard             | `motion/holo-foil.tsx` + the access pass   | One oversized foil band moved with `transform` and faded with `opacity`, instead of rewriting `background-position` and a dozen CSS variables per move                                                          |
| LightRays / Beams (ogl) | `three/spectral-field/` + `IntroField`     | Written fresh for three.js (no `ogl`, D-011); time advances only while the page settles and while the visitor moves, so it is still otherwise; high device tier only                                            |
| StaggeredMenu           | `site/mobile-menu.tsx` (the aperture)      | The sweeping colour layers became five shutter slats closing from the centre out; a line of light scans down once; every behaviour of D-012's rebuild kept (focus, trap, Escape, inert page, scroll lock)       |
| PillNav                 | `site/hud-nav.tsx` (in-house, replaces it) | A HUD rail: numbered mono readouts, a lock-on frame of two bracket pairs that glides between links (`translateX`, the leading pair first) and a spectrum hairline (`scaleX`), and a live scroll readout         |

**New in-house pieces.** `HudCorners` (the one bracket shape behind the hero
frame, the rail's ticks, the menu toggle, the reticle and every lock-on),
`Parallax` (decoration that drifts, turns or opens like a portal with the
scroll), the page-change shutter (`site/page-transition.tsx`), `HeroHud` (the
hero's display frame, depth ruler, one scan and two readouts), `DomainRail`
(Home's domains as a horizontal rail), the team access passes, the gallery's
`focus-dim` and curtain develop, and lock-on frames on the featured event
poster, the recruitment domain cards, the open recruitment card and the
contact form.

**Lead calls.**

- **Navigation is the HUD, not a pill.** Desktop links are numbered mono
  readouts in a glass strip with its own corner ticks; a lock-on frame rests
  on the current page and glides to whatever the pointer or keyboard is on.
  Links keep plain names (the numbers and decoding copies are `aria-hidden`),
  and the Recruitment button's text is still exactly "Recruitment".
- **Text that decodes stays text.** D-037 left scramble effects out because
  they change text every frame. `DecodeText` makes that safe: the real text is
  always in the DOM and only made transparent while an `aria-hidden` copy plays
  over it, on mono type (no reflow), once per trigger, never under reduced
  motion. It is used on eyebrows, the rail's labels, panel labels and dates —
  short labels only, never body copy or headings.
- **A reticle, not a custom cursor.** The system cursor is never hidden; the
  reticle only marks targets (links, buttons, fields) and folds away between
  them. It never takes a click, is `aria-hidden`, and does not exist on touch
  screens or under reduced motion.
- **Pages change behind a shutter** of five surface-coloured slats under the
  header, which stays put as a headset's display would. It plays only on client
  navigations (the first paint is never covered, D-010), is CSS keyframes
  (`animate-shutter`, `-shutter-label`; no animation library, D-033), never
  takes a click, unmounts when done, and is absent under reduced motion. Its
  slats and label rest invisible (`backwards` fill), so a stylesheet that
  disables animations can never leave the page covered.
- **The Home rail holds still with `position: sticky`, not a GSAP pin**: the
  section is made as tall as the travel plus a screen, so nothing in the DOM
  is moved and no pin competes with the hero's (`refreshPriority`, D-037).
  The rail runs from `md` on screens at least 40rem tall, with JavaScript,
  without reduced motion; elsewhere (a phone on its side included) the same
  links are a grid. Its frame is `overflow-x: clip`, so the browser
  can never scroll it sideways; a panel reached by keyboard scrolls the page
  to where that panel is in view instead. Panels lean with the scroll's speed
  and straighten when it stops (`skewX`, eased back on a token).
- **Stacked panels compute their own trigger points.** A stuck element reports
  where it is stuck, not where it sits in the flow, so `Stack` measures from
  the list's top and the panels' heights, clamped to the maximum scroll like
  `reachablePoint`. It stacks only from `md`, on screens at least 40rem tall,
  without reduced motion (the `stack:` variant); elsewhere a plain list. A
  panel steps back only once the next one starts to cover it, so a panel in
  full view is never dimmed.
- **One WebGL context per page still.** Home keeps the hero's; each inner page
  may now have one — the Spectral Field behind its opening — loaded only for
  the high device tier (`useHeroTier`), so phones, weaker devices, software
  WebGL and reduced motion keep the static lab, which is always drawn beneath.
  It renders below the device ratio, stops when off screen, and moves only
  while the page settles or the visitor moves. The settle is counted from the
  intro's mount, not the canvas's first frame, so a slow chunk shortens it and
  never stretches the page's motion past `--dur-settle`.
- **Nothing moves on its own for more than 5 seconds** (WCAG 2.2.2): the scan,
  the lock-ons, the shutter and the field's settle all end; everything else
  follows the reader's scroll or pointer.
- **Decoration is decoration.** Every new layer is `aria-hidden` with no pointer
  events, and none of them carries content: the motto and the realities in the
  hero HUD are readouts of things the page says in words, and the pass's tier,
  serial and barcode are ornaments around the member's real name, position and
  domain.
- **Gallery focus.** While one tile is hovered or focused, the others dim to
  `--motion-focus-dim` (opacity, and still ≥ 4.5:1 for the "+N" count); tiles
  below the fold develop from under a curtain (`scaleY`) as the reader reaches
  them. Tiles on screen at load, tiles that arrive with their own entrance and
  everything under reduced motion are never covered.
- **Transitions never fight scripted transforms.** Where GSAP owns an
  element's `transform` (the rail numerals, the developing photos), hover
  zooms use the separate `scale` property with `transition-[scale]`, so the
  scrub is not re-eased.
- **New tokens** in `globals.css`: `--z-shutter`, `--z-cursor`,
  `--scanline-gap`, `--reticle-size`, `--reticle-reach`, `--rail-panel`,
  `--rail-panel-height`, `--stack-step`, `--stack-hold`, `--text-numeral`, `--motion-depth`,
  `--motion-turn`, `--motion-portal`, `--motion-shelve`, `--motion-lean`,
  `--motion-focus-dim`, the keyframe tokens `animate-shutter`,
  `-shutter-label`, `-scan`, `-lock-on`, the static utilities `bg-scanlines`,
  `bg-holo`, `hud-corner`, `focus-dim`, and the variants `rail:` and `stack:`.
  `siteConfig.realities` (AR · VR · XR) and each team tier's `pass` label are
  structural constants.

**Not done, on purpose.** No new pages (the six-page sitemap is the contract),
no preloader or boot screen in front of content, no hidden system cursor, no
sound, no endless loops, no stat counters (D-007), and no new dependency.

---

## D-039 — The club's archive, password sign-in, a footer way in, and Netlify Blobs

**Decided by:** team (the club asked for the archive, the password, the two
admins and the footer link); lead for how each is built.

**Context.** The club supplied its first real media — the Hackathons and
Workshops folders (Tesseract'26, the club's 24-hour hackathon, and the Level 1
Unity workshop of October–November 2025: 11 photos and 13 short clips) — and
asked for four things at once: put them in the gallery, make the admin side
fully functional, give two people admin access with a password, and put a small
admin button in the footer. The live Netlify site (`sigarvr`) has no data store
connected (OPEN_ITEMS #9, #10), so on the live site every admin save failed.
Each answer below is the smallest change that makes that work without breaking
an earlier decision silently; where one is broken, it says so.

**1. The club archive is Git content, a third gallery source.** The media lives
in `public/archive/` (photos as WebP ≤ 2000 px with EXIF and location stripped;
clips as H.264 MP4 with fast start, baked-in letterbox bars cropped, ≤ 1280 px,
each with a WebP poster at its best frame) and is described by
`src/content/archive.json`, validated at build time like the other content files
(D-023) by `schemas/archive.ts`. The gallery shows it with the admin's photos and
the timeline events' photos, newest first, filtered by the same categories
(D-026). Why Git and not records: the archive must show on every deploy —
including the current one with no data store — and it is history, not news.
Admins see it read-only in `/admin/gallery`; changing it is a Git change
(handbook). Captions credit the photographer's watermark (VCLICK Multimedia
Prod.). Dates are the files' own (EXIF, or the share date for WhatsApp copies),
never invented. _Supersedes D-031's "photos only" for the archive; uploads
stay photos._

**2. Clips in the gallery.** A clip is a square poster tile like any photo
(D-031) with a play badge and its length; the button reads "<alt> (video, 0:07)".
A muted preview plays only while a mouse hovers it (user-initiated, WCAG 2.2.2)
and never under reduced motion; nothing autoplays. The viewer plays it with
native controls (no player library). The newest _photo_ leads the grid — a
clip's small poster never fills the double tile.

**3. Password sign-in.** An Auth.js Credentials provider (`password`) for the
allowlisted emails with a password from `ADMIN_PASSWORD` — env only, never in
code. Google and the development sign-in are unchanged; the allowlist is still
re-checked on every request (D-030's three locks). Hardening: constant-time
comparison; at most 10 attempts per 15 minutes per IP and 20 per email, counted
in the data layer (hashed keys) with an in-memory fallback; one message for a
wrong password and a non-admin; changing the password ends every password
session (a fingerprint in the token). The Setup card warns while the password is
weak. **The club chose a short password; it works, the dashboard says it is
weak, and changing it is one Netlify variable.** _Amends D-030._

**4. A footer link to the sign-in page.** A small "Admin" link in the footer's
bottom row (`rel="nofollow"`, no prefetch, ≥ 24 px target). Admin routes stay
`noindex, nofollow`, disallowed in `robots.txt` and out of the sitemap; the
proxy and every action still guard them. _Supersedes rule 6's "links to /admin
from nowhere"_: the e2e test now asserts exactly one admin link per page, in the
footer, `nofollow`, never in the header.

**5. Netlify Blobs as a data backend.** `DATA_BACKEND=netlify-blobs` implements
the two ports (D-029) on Netlify's built-in Blobs storage, and is the default on
Netlify when no Upstash variables are set — so the admin panel works on the
club's existing site with no new account. Records: one JSON snapshot per
namespace and collection, written with compare-and-swap on the blob's etag
(every write is still all-or-nothing and version-checked). Files: blobs served
through the same signed-upload route as local mode, uploaded in ≤ 4 MiB parts
(Netlify Functions cap request bodies), type- and size-checked on arrival.
Upstash + R2 stay the documented production backend (D-025) and switching is
one variable. _Extends the locked stack; recorded here because CLAUDE.md §2 says
to raise it, and the club asked for it to work now._

**6. Integrating `main`.** Srushti's "Who we are" section (d3151b2) is merged:
its "About Reality Spectra" card is a `Card spotlight` in `Tilt` with its copy in
`site.json`; the split-flap heading maps to `DecodeText` on the eyebrow
(headings stay real text, D-038); Magic Bento stays rejected (D-013); npm and
yarn lockfiles are ignored (pnpm only).

**7. More motion, same contract.** Home gains "Moments from the lab": the
archive on a CSS-3D cylinder that turns with the scroll and leans toward the
pointer (inspired by React Bits' CircularGallery, which needs `ogl`, D-011) —
a scroll-snap strip on phones and under reduced motion. Gallery filters animate
with GSAP Flip (transform only). Everything stays inside rule 4, the tokens and
WCAG 2.2.2.

**Not done, on purpose.** No new pages; no autoplaying video; no password in
the repository; the Upstash/R2 path is not removed; the club's Instagram was
still unreadable by tools.
