# `src/components/sections`

Composed page sections: the hero, the content sections of Home, About,
Recruitment and Contact, and the events and gallery sections.

Sections receive data as props from their page. They never call the repository
layer themselves.

Built in **Stage 2** (Hero) and **Stages 4, 7 and 8** (the rest).

## Stage 4

| File                     | Used on                     | What it renders                                                        |
| ------------------------ | --------------------------- | ---------------------------------------------------------------------- |
| `page-intro.tsx`         | About, Recruitment, Contact | Eyebrow, the page's `<h1>`, lead                                       |
| `about-intro.tsx`        | Home                        | Motto, "Who we are", short about; opens under the horizon glow (D-018) |
| `mission-vision.tsx`     | Home, About                 | Mission and vision cards                                               |
| `domain-overview.tsx`    | Home                        | Domain names by group, link to the full list                           |
| `domain-list.tsx`        | Recruitment                 | Every domain with its full description, by group                       |
| `about-story.tsx`        | About                       | The long about, with an "at a glance" card                             |
| `team-section.tsx`       | About                       | Team heading + empty state until Stage 8 passes members in             |
| `recruitment-status.tsx` | Recruitment                 | Open: Apply now + QR; closed: where to follow (interim, D-024)         |
| `contact-details.tsx`    | Contact                     | Email, phone, address, map — "Coming soon" where not set               |
| `social-channels.tsx`    | Contact                     | Each channel with a button and (from `md`) a QR code                   |
| `social-buttons.tsx`     | Recruitment, Contact        | The "Follow on …" button row                                           |
| `sponsorship-notice.tsx` | Contact                     | Honest "form opens soon" notice until Stage 8 (D-024)                  |

## Stage 7

| File                  | Used on         | What it renders                                                                  |
| --------------------- | --------------- | -------------------------------------------------------------------------------- |
| `current-events.tsx`  | Events          | Current events, soonest first: poster whole in a 4:5 frame, details, Register    |
| `event-timeline.tsx`  | Events          | Timeline of past events: date, category, recap, first photos ("+N" for the rest) |
| `gallery-browser.tsx` | Gallery         | Category filters with counts, photo grid, "Show more" (client)                   |
| `photo-grid.tsx`      | Events, Gallery | Square centre-cropped tiles and the full-size viewer (Modal, arrow keys)         |
| `paragraphs.tsx`      | Events          | Admin-written text as paragraphs, never HTML (D-031)                             |

## `hero/` (Stage 2)

| File                    | Renders on | What it does                                               |
| ----------------------- | ---------- | ---------------------------------------------------------- |
| `hero.tsx`              | server     | the text: eyebrow, `<h1>` name, intro line, two CTAs       |
| `hero-still.tsx`        | server     | the designed static frame, SVG from tokens (D-017)         |
| `hero-stage.tsx`        | client     | tier, lazy canvas, intro, scroll-out pin, pointer, pausing |
| `hero-title.tsx`        | client     | the `<h1>` as `FocusText`, swept once during the intro     |
| `hero-intro-context.ts` | client     | `idle` → `playing` → `done`                                |

The name is real text at first paint (D-010). The intro is about 1.35 s,
skippable (button or Esc), plays once per session (`sessionStorage`), and is
skipped entirely if the canvas is not ready within 2.5 s. The scroll-out follows
D-018.
