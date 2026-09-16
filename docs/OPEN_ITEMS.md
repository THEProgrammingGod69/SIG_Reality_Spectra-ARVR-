# Open items

Inputs and decisions that are still outstanding. Each one blocks a specific
stage, so the list is ordered by when it is needed, not by size.

Update the status column as items land. Anything still open when its stage starts
should be raised rather than worked around with a placeholder that ships.

---

## Blocking Stage 2 — animation system and landing hero

| #   | Item                                                                                      | Why it blocks                                                             | Status                             |
| --- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------- |
| 1   | **Landing concept and motion spec**                                                       | Drives the whole 3D scene                                                 | Drafted — SIG Style & Motion Board |
| 2   | **Decision: allow `ogl`-based effects in the hero, or rebuild them in React Three Fiber** | The board proposes Galaxy and LightRays, which add a second WebGL library | Open                               |
| 3   | **Decision: keep the 2.4 s intro, or make the headline readable immediately**             | The board's own guardrail says content is readable within 1.5 s           | Open                               |
| 4   | **A real mid-range Android phone** to test on                                             | The 50+ fps low-tier budget cannot be signed off from a desktop           | Open                               |

## Blocking Stage 3 — design system

| #   | Item                                                                                       | Why it blocks                                                                                                                                                                       | Status                             |
| --- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 5   | **Vector logo with a transparent background**, light and dark variants, plus a square mark | The supplied `SIG_LOGO.svg` is a 1.7 MB PNG wrapped in SVG with a white background — it cannot be recoloured and shows a white box on a dark site. See `references/brand/README.md` | Open                               |
| 6   | **Brand colours and fonts**                                                                | Token values stay neutral placeholders until adopted                                                                                                                                | Drafted — SIG Style & Motion Board |
| 7   | **Decision: lighten `text-subtle`** (measures about 3.4:1) to reach WCAG AA 4.5:1          | Stage 3 acceptance requires AA contrast                                                                                                                                             | Open                               |
| 8   | **VIT branding rules** — mandated marks, colours, placement                                | Compliance, and it can change layout                                                                                                                                                | Open                               |

## Blocking Stage 4 — static content

| #   | Item                                                                               | Status |
| --- | ---------------------------------------------------------------------------------- | ------ |
| 9   | Club name as displayed and the **one-line intro** for the hero                     | Open   |
| 10  | **Mission**, **vision** and the short and long **about us** copy                   | Open   |
| 11  | **List of the club's domains**, with a short description of each                   | Open   |
| 12  | **Contact details**: official club email, phone, address or map link, social links | Open   |

## Blocking Stage 5 — data layer

| #   | Item                                                                                                                     | Status |
| --- | ------------------------------------------------------------------------------------------------------------------------ | ------ |
| 13  | Vercel project created under the **club** account, repo connected                                                        | Open   |
| 14  | Upstash Redis added via Vercel Marketplace, `vercel env pull` run                                                        | Open   |
| 15  | Vercel Blob store created, token in env                                                                                  | Open   |
| 16  | **Confirm the event categories**: workshop, hackathon, meetup, talk, competition, other. They become the gallery filters | Open   |
| 17  | **Confirm the team hierarchy levels** (for example faculty, leadership, leads, members) and what counts as "core"        | Open   |

## Blocking Stage 6 — admin auth

| #   | Item                                                                                                     | Status |
| --- | -------------------------------------------------------------------------------------------------------- | ------ |
| 18  | Google Cloud OAuth client under the **club** Google account, with localhost and production callback URLs | Open   |
| 19  | `ADMIN_EMAILS` — the 2–3 accounts that get admin access                                                  | Open   |

## Blocking Stage 7 — events and gallery

| #   | Item                                                                                      | Status |
| --- | ----------------------------------------------------------------------------------------- | ------ |
| 20  | 3–5 **past events** with dates, details and photos (consent checked) to seed the timeline | Open   |
| 21  | One example **registration link** (typically VIERP)                                       | Open   |
| 22  | Preferred **poster aspect ratio** (e.g. 4:5 or 16:9) — the crop step is locked to it      | Open   |

## Blocking Stage 8 — team, recruitment and sponsorships

| #   | Item                                                                    | Status |
| --- | ----------------------------------------------------------------------- | ------ |
| 23  | **Team list**: name, position, photo, hierarchy level, core or not      | Open   |
| 24  | **Roles and responsibilities PDF** and the current **Google Form** link | Open   |
| 25  | **Is recruitment open right now?**                                      | Open   |
| 26  | Resend account with a verified sending domain                           | Open   |
| 27  | Cloudflare Turnstile site key and secret                                | Open   |

## Blocking Stage 10 — go live

| #   | Item                                                                            | Status |
| --- | ------------------------------------------------------------------------------- | ------ |
| 28  | **Domain name decision plus DNS access**, registered under club/VIT ownership   | Open   |
| 29  | Confirmation that external hosting is acceptable rather than VIT infrastructure | Open   |
| 30  | Named next-tenure maintainer(s)                                                 | Open   |

---

## Notes

- Items 5, 12, 28 and 29 depend on people outside the build team and have the
  longest lead times, so they are worth chasing first even though some of their
  stages come later.
- Every third-party account (items 13–15, 18, 26, 27) must be created on a
  **club-owned** account, never a personal one. Yearly handover depends on it.
- Removed with the architecture revision: projects, achievements, resources,
  project/event/album detail pages, the sponsor brochure and the separate
  Collaborate page. Their inputs are no longer needed.
