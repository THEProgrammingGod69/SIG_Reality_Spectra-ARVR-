# Open items

Inputs that are still outstanding. Each one blocks a specific stage, so the list is
ordered by when it is needed, not by size. Decisions already made are in
[`DECISIONS.md`](./DECISIONS.md), not here.

Update the status column as items land. Anything still open when its stage starts
should be raised rather than worked around with a placeholder that ships.

---

## Blocking Stage 2 — animation system and landing hero

| #   | Item                                          | Why it blocks                                                   | Status |
| --- | --------------------------------------------- | --------------------------------------------------------------- | ------ |
| 1   | **A real mid-range Android phone** to test on | The 50+ fps low-tier budget cannot be signed off from a desktop | Open   |

## Blocking Stage 3 — design system

| #   | Item                                                                                       | Why it blocks                                                                                                                                                                       | Status |
| --- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 2   | **Vector logo with a transparent background**, light and dark variants, plus a square mark | The supplied `SIG_LOGO.svg` is a 1.7 MB PNG wrapped in SVG with a white background — it cannot be recoloured and shows a white box on a dark site. See `references/brand/README.md` | Open   |
| 3   | **VIT branding rules** — mandated marks, colours, placement                                | Compliance, and it can change layout                                                                                                                                                | Open   |

## Blocking Stage 4 — static content

| #   | Item                                                                               | Status |
| --- | ---------------------------------------------------------------------------------- | ------ |
| 4   | Club name as displayed and the **one-line intro** for the hero                     | Open   |
| 5   | **Mission**, **vision** and the short and long **about us** copy                   | Open   |
| 6   | **List of the club's domains**, with a short description of each                   | Open   |
| 7   | **Contact details**: official club email, phone, address or map link, social links | Open   |

## Blocking Stage 5 — data layer

| #   | Item                                                                                                                            | Status |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 8   | Vercel project created under the **club** account, repo connected                                                               | Open   |
| 9   | Upstash Redis added via Vercel Marketplace, `vercel env pull` run                                                               | Open   |
| 10  | Vercel Blob store created, token in env                                                                                         | Open   |
| 11  | **Confirm the categories**: workshop, hackathon, meetup, talk, competition, other. They are shared by events and gallery photos | Open   |
| 12  | **Confirm the team hierarchy levels** (for example faculty, leadership, leads, members) and what counts as "core"               | Open   |

## Blocking Stage 6 — admin auth

| #   | Item                                                                                                     | Status |
| --- | -------------------------------------------------------------------------------------------------------- | ------ |
| 13  | Google Cloud OAuth client under the **club** Google account, with localhost and production callback URLs | Open   |
| 14  | `ADMIN_EMAILS` — the 2–3 accounts that get admin access                                                  | Open   |

## Blocking Stage 7 — events and gallery

| #   | Item                                                                                      | Status |
| --- | ----------------------------------------------------------------------------------------- | ------ |
| 15  | 3–5 **past events** with dates, details and photos (consent checked) to seed the timeline | Open   |
| 16  | One example **registration link** (typically VIERP)                                       | Open   |
| 17  | Preferred **poster aspect ratio** (e.g. 4:5 or 16:9) — the crop step is locked to it      | Open   |
| 18  | A first batch of **standalone club photos** (consent checked), with a category for each   | Open   |

## Blocking Stage 8 — team, recruitment and sponsorships

| #   | Item                                                                    | Status |
| --- | ----------------------------------------------------------------------- | ------ |
| 19  | **Team list**: name, position, photo, hierarchy level, core or not      | Open   |
| 20  | **Roles and responsibilities PDF** and the current **Google Form** link | Open   |
| 21  | **Is recruitment open right now?**                                      | Open   |
| 22  | Cloudflare Turnstile site key and secret                                | Open   |

## Blocking Stage 10 — go live

| #   | Item                                                                            | Status |
| --- | ------------------------------------------------------------------------------- | ------ |
| 23  | **Domain name decision plus DNS access**, registered under club/VIT ownership   | Open   |
| 24  | Confirmation that external hosting is acceptable rather than VIT infrastructure | Open   |
| 25  | Named next-tenure maintainer(s)                                                 | Open   |

---

## Resolved

| Was                                                | Resolved by                                            |
| -------------------------------------------------- | ------------------------------------------------------ |
| Landing concept, mood, motion spec                 | SIG Style & Motion Board; hero direction D-001, D-010  |
| 3D headset model                                   | Built procedurally in the R3F scene — no `.glb` needed |
| Brand colours and fonts                            | Style Board palette; fonts D-002                       |
| Caption colour failing WCAG AA                     | D-003 (`#797F8D`)                                      |
| `ogl` effects in the hero; intro vs. readable text | D-010, D-011                                           |
| UI design references                               | Style Board and the design inspiration board           |
| Sponsor page content, brochure, "why join" copy    | Removed from scope with the architecture revision      |
| Resend account and verified sending domain         | Removed: no email integration (D-008)                  |
| Gallery: event photos only, or also standalone     | Both (D-005); item 18 above covers the first photos    |

---

## Notes

- Items 2, 7, 23 and 24 depend on people outside the build team and have the
  longest lead times, so they are worth chasing first even though some of their
  stages come later.
- Every third-party account (items 8–10, 13, 22) must be created on a
  **club-owned** account, never a personal one. Yearly handover depends on it.
