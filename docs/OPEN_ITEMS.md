# Open items

Inputs and decisions that are still outstanding. Each one blocks a specific
stage, so the list is ordered by when it is needed, not by size.

Update the status column as items land. Anything still open when its stage starts
should be raised rather than worked around with a placeholder that ships.

---

## Blocking Stage 2 — animation system and landing hero

| #   | Item                                                                                                        | Why it blocks                                                              | Status |
| --- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------ |
| 1   | **Animation references** in `references/animation/`, with a line per file in `NOTES.md` saying what to copy | Without them the hero is guesswork, and Stage 3 would then have to redo it | Open   |
| 2   | **Landing concept**, one paragraph — what a visitor sees from load to first scroll                          | Drives the whole 3D scene                                                  | Open   |
| 3   | **Mood words**, including what to avoid                                                                     | Keeps the scene on the "XR lab, not gaming neon" brief                     | Open   |
| 4   | **3D models** (`.glb`, ideally under 2 MB) in `public/models/`, or an explicit "none"                       | Decides modelled vs procedural geometry                                    | Open   |
| 5   | **A real mid-range Android phone** to test on                                                               | The 50+ fps low-tier budget cannot be signed off from a desktop            | Open   |

## Blocking Stage 3 — design system

| #   | Item                                                                                       | Why it blocks                                                                                                                                                                                                | Status |
| --- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 6   | **Vector logo with a transparent background**, light and dark variants, plus a square mark | The supplied `SIG_LOGO.svg` is a 1.7 MB PNG wrapped in SVG with a white background — it cannot be recoloured, will not scale cleanly, and shows a white box on a dark site. See `references/brand/README.md` | Open   |
| 7   | **Brand colours (hex)** — background, surface, text, muted, one accent, border             | Token values stay neutral placeholders until these land                                                                                                                                                      | Open   |
| 8   | **Fonts** — Google Font names, or files in `public/fonts`                                  | Currently using Geist as a stand-in                                                                                                                                                                          | Open   |
| 9   | **VIT branding rules** — mandated marks, colours, placement                                | Compliance, and it can change layout                                                                                                                                                                         | Open   |
| 10  | **UI design images** in `references/design/` + `NOTES.md`                                  | Same reason as the animation references                                                                                                                                                                      | Open   |

## Blocking Stage 4 — content

| #   | Item                                                                          | Status |
| --- | ----------------------------------------------------------------------------- | ------ |
| 11  | About copy, mission, values                                                   | Open   |
| 12  | Team list: name, role, photo, LinkedIn, current/alumni                        | Open   |
| 13  | Projects: title, pitch, description, tech tags, team, GitHub URL, cover image | Open   |
| 14  | Achievements: title, date, description, image                                 | Open   |
| 15  | Gallery images grouped by event/year, with consent checked                    | Open   |
| 16  | Resources: title, type, link                                                  | Open   |
| 17  | All images compressed to WebP, 300 KB or less each                            | Open   |

## Blocking Stage 5 — data layer

| #   | Item                                                              | Status |
| --- | ----------------------------------------------------------------- | ------ |
| 18  | Vercel project created under the **club** account, repo connected | Open   |
| 19  | Upstash Redis added via Vercel Marketplace, `vercel env pull` run | Open   |
| 20  | Vercel Blob store created, token in env                           | Open   |
| 21  | 3–5 real past events to seed with                                 | Open   |

## Blocking Stage 6 — admin auth

| #   | Item                                                                                                     | Status |
| --- | -------------------------------------------------------------------------------------------------------- | ------ |
| 22  | Google Cloud OAuth client under the **club** Google account, with localhost and production callback URLs | Open   |
| 23  | `ADMIN_EMAILS` — the 2–3 accounts that get admin access                                                  | Open   |

## Blocking Stage 7 — events

| #   | Item                                                                             | Status |
| --- | -------------------------------------------------------------------------------- | ------ |
| 24  | One example **VIERP** event URL, so the host can be validated                    | Open   |
| 25  | Preferred poster aspect ratio (e.g. 4:5 or 16:9) — the crop step is locked to it | Open   |

## Blocking Stage 8 — recruitment and sponsors

| #   | Item                                                                                            | Status |
| --- | ----------------------------------------------------------------------------------------------- | ------ |
| 26  | Current Google Form URL, or a test form                                                         | Open   |
| 27  | "Why join" copy                                                                                 | Open   |
| 28  | **Official club email address** — also needed for the Contact page and enquiry acknowledgements | Open   |
| 29  | Resend account with a verified sending domain                                                   | Open   |
| 30  | Cloudflare Turnstile site key and secret                                                        | Open   |
| 31  | Sponsor page content: what the club offers, reach numbers, brochure PDF                         | Open   |

## Blocking Stage 10 — go live

| #   | Item                                                                            | Status |
| --- | ------------------------------------------------------------------------------- | ------ |
| 32  | **Domain name decision plus DNS access**, registered under club/VIT ownership   | Open   |
| 33  | Confirmation that external hosting is acceptable rather than VIT infrastructure | Open   |
| 34  | Named next-tenure maintainer(s)                                                 | Open   |

---

## Notes

- Items 6, 28, 32 and 33 were already flagged as unresolved in the club's initial
  planning document. They have the longest lead times because they depend on
  people outside the build team, so they are worth chasing first even though
  their stages come last.
- Every third-party account (items 18–20, 22, 29, 30) must be created on a
  **club-owned** account, never a personal one. Yearly handover depends on it.
