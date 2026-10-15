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

The gallery shows the store's photos and the club archive (Git,
`src/content/archive.json`) together; the page merges them, so the archive
shows without a data store, and with a one-line `LoadFailed inline` note when
the store fails. Filtering rearranges the grid with GSAP Flip (`scale: true`,
so `transform` only): staying tiles glide, new ones fade and grow in, leaving
ones (kept in the list, hidden and inert, for their exit) fade out; nothing
moves under reduced motion. The lead double tile is the newest photo, never a
clip.

Clips (archive only) are tiles like photos — the poster, a decorative play
badge with the length, and "(video, 0:07)" for screen readers. A mouse hovering
one previews it muted and looping (mounted on hover, removed on leave; never
under reduced motion or on touch). The viewer plays it with native controls
(`preload="metadata"`, never autoplay); the arrow keys leave the player's own
seek keys alone. The viewer also shows an item's album and credit.
| `paragraphs.tsx` | Events | Admin-written text as paragraphs, never HTML (D-031) |

## Stage 8

| File                      | Used on                             | What it renders                                                                                        |
| ------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `team-section.tsx`        | About                               | The team, by tier: square photo or initials, name, position, domain; `<Tilt>` cards                    |
| `sponsorship-section.tsx` | Contact                             | The request form, or the club's channels where the form cannot work (D-032)                            |
| `sponsorship-form.tsx`    | Contact                             | The form (client): validation loaded on first focus, honeypot, Turnstile, sent/failed states           |
| `load-failed.tsx`         | Events, Gallery, About, Recruitment | What a section shows when `publicRead()` failed: a calm note (`inline`: one line), never an error page |

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

`PageIntro` now runs under the header (`data-full-bleed`) over a `LabBackdrop`,
with its title in `SplitText play="load"`. Cards that should feel lit pass
`spotlight`. The events timeline wraps its list in `TimelineRail`; its heading
and list keep one parent (the e2e suite finds entries from the heading).
