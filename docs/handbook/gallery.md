# Gallery

The public Gallery shows three kinds of media together, newest first:

- **Photos of events on the timeline** — you add these in the event itself
  ([events.md](./events.md)); they appear here automatically.
- **Club photos** — anything not from one event: lab sessions, the team,
  behind the scenes. You add these in the **Gallery** tool.
- **The club archive** — the Tesseract'26 hackathon and the Unity workshop
  photos and short clips. These live in the website's code (Git), not in the
  panel, so they show even if the data store is down. The **Gallery** tool
  lists them read-only.

Visitors can filter by category: hackathons, competitions, workshops, other.
Clips show a play badge; they play only when a visitor opens them (or, with a
mouse, as a silent preview while hovering).

## Add club photos

1. **Gallery** → choose the **Category for new uploads**.
2. **Upload photos**: pick or drop as many as you like (a whole folder is
   fine; they upload three at a time).
3. For each photo, write what it shows in **Describe the photo (alt text)**.
   You can change one photo's category or add an optional caption.
4. **Save N photos**. If one cannot be saved, it stays in the list with the
   reason; the others are saved.

## Edit or delete a club photo

Under **Club photos**, change a photo's description, category or caption and
press its **Save**, or **Delete** it (it asks first). Photos of events are
edited in their event, not here.

## Change the archive (needs Git)

The archive is a developer task. Each item is a file in `public/archive/`
(photos as WebP, clips as MP4 with a WebP poster) and an entry in
`src/content/archive.json` with its category, date, description (alt),
caption and photo credit. `pnpm build` refuses an entry with a missing file or
field. Commit, push, and the site redeploys with it.

## Before you upload

Only upload photos the people in them are happy to have online. Keep the
photographer's credit when a photo carries a watermark.
