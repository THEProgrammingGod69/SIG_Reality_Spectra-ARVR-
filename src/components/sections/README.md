# `src/components/sections`

Composed page sections: Hero, MissionVision, CoreTeam, TeamHierarchy,
CurrentEvent, EventTimeline, GalleryGrid, DomainList, RecruitmentStatus,
ContactDetails and SponsorshipForm.

Sections receive data as props from their page. They never call the repository
layer themselves, and the admin preview renders the same sections the public
site does.

Built in **Stage 2** (Hero) and **Stages 4, 7 and 8** (the rest).

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
