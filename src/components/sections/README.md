# `src/components/sections`

Composed page sections: the hero, the content sections of Home, About,
Recruitment and Contact, and the events and gallery sections.

Sections receive data as props from their page. They never call the repository
layer themselves, and client sections never import a schema module at runtime —
it would pull zod into the browser; take the constants as props (D-033).

Built in **Stage 2** (Hero) and **Stages 4, 7 and 8** (the rest).

## Stage 4

| File                     | Used on                     | What it renders                                                            |
| ------------------------ | --------------------------- | -------------------------------------------------------------------------- |
| `page-intro.tsx`         | About, Recruitment, Contact | Eyebrow, the page's `<h1>`, lead                                           |
| `about-intro.tsx`        | Home                        | Motto, "Who we are", short about; opens under the horizon glow (D-018)     |
| `mission-vision.tsx`     | Home, About                 | Mission and vision (and on Home the motto) as stacking panels (D-038)      |
| `domain-overview.tsx`    | Home                        | Domain names, each tagged with its group, on the rail (`domain-rail.tsx`)  |
| `domain-rail.tsx`        | Home                        | The domains as a horizontal rail from `md`, a grid elsewhere (D-038)       |
| `intro-field.tsx`        | About, Events, …            | The Spectral Field shader behind a page intro, high tier only (D-038)      |
| `domain-list.tsx`        | Recruitment                 | Every domain with its full description, by group                           |
| `about-story.tsx`        | About                       | The long about, with an "at a glance" card                                 |
| `recruitment-status.tsx` | Recruitment                 | Open: Apply now + QR + roles PDF or "coming soon"; closed: where to follow |
| `contact-details.tsx`    | Contact                     | Email, phone, address, map — "Coming soon" where not set                   |
| `social-channels.tsx`    | Contact                     | Each channel with a button and (from `md`) a QR code                       |
| `social-buttons.tsx`     | Recruitment, Contact        | The "Follow on …" button row                                               |

## Stage 7

| File                  | Used on         | What it renders                                                                       |
| --------------------- | --------------- | ------------------------------------------------------------------------------------- |
| `current-events.tsx`  | Events          | Current events, soonest first: poster whole in a 4:5 frame, details, Register         |
| `event-timeline.tsx`  | Events          | Timeline of past events: date, category, recap, first photos ("+N" for the rest)      |
| `gallery-browser.tsx` | Gallery         | Category filters (categories passed in) with counts, photo grid, "Show more" (client) |
| `photo-grid.tsx`      | Events, Gallery | Square centre-cropped tiles and the full-size viewer (Modal, arrow keys)              |
| `paragraphs.tsx`      | Events          | Admin-written text as paragraphs, never HTML (D-031)                                  |

## Stage 8

| File                      | Used on                             | What it renders                                                                              |
| ------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------- |
| `team-section.tsx`        | About                               | The team, by tier: square photo or initials, name, position, domain; `<Tilt>` cards          |
| `sponsorship-section.tsx` | Contact                             | The request form, or the club's channels where the form cannot work (D-032)                  |
| `sponsorship-form.tsx`    | Contact                             | The form (client): validation loaded on first focus, honeypot, Turnstile, sent/failed states |
| `load-failed.tsx`         | Events, Gallery, About, Recruitment | What a section shows when `publicRead()` failed: a calm note, never an error page            |

## `hero/` (Stage 2)

| File                    | Renders on | What it does                                                    |
| ----------------------- | ---------- | --------------------------------------------------------------- |
| `hero.tsx`              | server     | the text: eyebrow, `<h1>` name, intro line, two CTAs            |
| `hero-still.tsx`        | server     | the designed static frame, SVG from tokens (D-017)              |
| `hero-stage.tsx`        | client     | tier, lazy canvas, intro, scroll-out pin, pointer, pausing      |
| `hero-title.tsx`        | client     | the `<h1>` as `FocusText`, swept once during the intro          |
| `hero-hud.tsx`          | server     | the headset's display: frame, ruler, one scan, readouts (D-038) |
| `hero-intro-context.ts` | client     | `idle` → `playing` → `done`                                     |

The name is real text at first paint (D-010). The intro is about 1.35 s,
skippable (button or Esc), plays once per session (`sessionStorage`), and is
skipped entirely if the canvas is not ready within 2.5 s. The scroll-out follows
D-018.

## Premium pass (D-037)

| File                  | Used on               | What it renders                                                                                     |
| --------------------- | --------------------- | --------------------------------------------------------------------------------------------------- |
| `section-heading.tsx` | every content section | `SectionHeading` (eyebrow, rising title, lead, action) and `EyebrowDash`                            |
| `domain-ticker.tsx`   | Home                  | The domains as two scroll-linked bands, opposite ways — decorative, the overview lists them as text |
| `home-cta.tsx`        | Home                  | The closing call to action in the lab: find your domain, or work with the club                      |

| `moments.tsx` | Home | "Moments from the lab": heading, the reel, "Open the gallery"; omitted when there are no moments |
| `moments-reel.tsx` | Home | The moments as a ring in CSS 3D that turns with the scroll (client); a scroll-snap strip elsewhere |

`Moments` takes `moments: readonly { key, src, alt, caption, categoryLabel,
width, height }[]` — photos, and clips as their poster frame — and shows at most
`REEL_SLOTS` (12) of them. The reel is our CircularGallery: React Bits' one draws
with `ogl` (D-011), so this one stands the cards around a ring in CSS 3D. From
`md`, with JavaScript and without reduced motion (`data-reel="on"`, the `reel:`
variant) the ring turns as the reel scrolls through the viewport (scrubbed,
`reachablePoint()`, no pinning) and leans toward a mouse pointer; transform and
opacity only. Phones, no JavaScript and reduced motion get a keyboard-scrollable
strip (a named, focusable region) with no 3D. Its geometry is tokens:
`--reel-card`, `--reel-strip-card`, `--reel-gap`, `--reel-perspective`,
`--reel-lean`; the radius is derived from them in CSS. Demo: `/dev/motion`.

`PageIntro` now runs under the header (`data-full-bleed`) over a `LabBackdrop`,
with its title in `SplitText play="load"`. Cards that should feel lit pass
`spotlight`. The events timeline wraps its list in `TimelineRail`; its heading
and list keep one parent (the e2e suite finds entries from the heading).
