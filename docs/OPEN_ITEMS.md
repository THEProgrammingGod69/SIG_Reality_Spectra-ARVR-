# Open items

Inputs that are still outstanding. Each one blocks a specific stage, so the list is
ordered by when it is needed, not by size. Decisions already made are in
[`DECISIONS.md`](./DECISIONS.md), not here.

Update the status column as items land. Anything still open when its stage starts
should be raised rather than worked around with a placeholder that ships.

---

## Blocking Stage 2 — animation system and landing hero

| #   | Item                                          | Why it blocks                                                   | Status                                                                                                                                                                                                                           |
| --- | --------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **A real mid-range Android phone** to test on | The 50+ fps low-tier budget cannot be signed off from a desktop | Open — Stage 2 is built; only this sign-off remains. Open `/?hero-tier=low` on the phone (dev server on the LAN), scroll the hero, and note the fps; the low tier is tuned in `HERO_TIER_BUDGET` (`src/lib/motion/hero-tier.ts`) |

## Before go-live — remaining contact details

Stage 4 shipped with "Coming soon" placeholders for these (D-024). `pnpm check:launch`
fails until they are filled in `src/content/contact.json`.

| #   | Item                                                                                                                                    | Status                                 |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 7   | **Official club email**, **phone**, **address** and a **Google Maps link** (embed optional); LinkedIn / GitHub org if the club has them | Open — Instagram and WhatsApp supplied |

## Accounts for the data layer (Stage 5 built; needed before Stage 6 goes live)

Stage 5 is built and unit-tested against in-memory stores. These accounts let
`pnpm test:live` and `pnpm seed` run against the real services, and every
later stage needs them. Step-by-step setup: [`SETUP_STORAGE.md`](./SETUP_STORAGE.md).

| #   | Item                                                                                                                                   | Status                                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 8   | **Netlify** site on the club account, repo connected; Stage 5 variables set per deploy context (`DATA_NAMESPACE` = `prod` / `preview`) | Site deployed (D-025); variables open             |
| 9   | **Upstash Redis** database on the club account; REST URL and token in `.env.local` and Netlify                                         | Open                                              |
| 10  | **Cloudflare R2** bucket on the club account: API token, public URL (r2.dev or custom domain) and the CORS rule                        | Open                                              |
| 26  | First deploy with data: an admin save shows on the public page at the next reload, from any instance (Netlify + `updateTag`, D-025)    | Open — check when Stage 6/7 first save on Netlify |

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

| #   | Item                                                                                    | Status                                                                                          |
| --- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 19  | **Team list**: name, position, photo; core team or secretary (and which domain) — D-027 | Open                                                                                            |
| 20  | **Roles and responsibilities PDF** and the current **Google Form** link                 | Form link supplied (D-024); the page says the PDF is "coming soon" until it is uploaded (D-028) |
| 21  | **Is recruitment open right now?**                                                      | Yes — interim `recruitment.json` (D-024)                                                        |
| 22  | Cloudflare Turnstile site key and secret                                                | Open                                                                                            |

## Blocking Stage 10 — go live

| #   | Item                                                                                                           | Status |
| --- | -------------------------------------------------------------------------------------------------------------- | ------ |
| 23  | **Domain name decision plus DNS access**, registered under club/VIT ownership                                  | Open   |
| 24  | Confirmation that external hosting (Netlify, Upstash, Cloudflare) is acceptable rather than VIT infrastructure | Open   |
| 25  | Named next-tenure maintainer(s)                                                                                | Open   |

---

## Resolved

| Was                                                                 | Resolved by                                                                                                                                                                       |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Landing concept, mood, motion spec                                  | SIG Style & Motion Board; hero direction D-001, D-010                                                                                                                             |
| 3D headset model                                                    | Built procedurally in the R3F scene — no `.glb` needed                                                                                                                            |
| Brand colours and fonts                                             | Style Board palette; fonts D-002                                                                                                                                                  |
| Caption colour failing WCAG AA                                      | D-003 (`#797F8D`)                                                                                                                                                                 |
| `ogl` effects in the hero; intro vs. readable text                  | D-010, D-011                                                                                                                                                                      |
| UI design references                                                | Style Board and the design inspiration board                                                                                                                                      |
| Sponsor page content, brochure, "why join" copy                     | Removed from scope with the architecture revision                                                                                                                                 |
| Resend account and verified sending domain                          | Removed: no email integration (D-008)                                                                                                                                             |
| Gallery: event photos only, or also standalone                      | Both (D-005); item 18 above covers the first photos                                                                                                                               |
| #2 Logo with transparent background, light/dark variants and a mark | Club brand pack, Oct 2026 — raster masters in `references/brand`; original badge + white-ring mark ship via `next/image` (D-021). A hand-drawn vector mark remains a nice-to-have |
| #3 VIT branding rules                                               | None apply: VIT is the college name only, with no logo or rules. It appears as plain text in the club credit line (footer, hero eyebrow, menu)                                    |
| #4 Club name and one-line intro                                     | Content brief, Oct 2026 — `src/content/site.json` (D-023)                                                                                                                         |
| #5 Mission, vision, short and long about                            | Content brief — `src/content/site.json`                                                                                                                                           |
| #6 Domains with descriptions                                        | Content brief — ten domains in `src/content/domains.json`, split technical / non-technical (D-024)                                                                                |
| #11 Confirm the categories                                          | Hackathon, competition, workshop, other (D-026)                                                                                                                                   |
| #12 Team hierarchy levels and what counts as "core"                 | Core team (six office-bearers), then one secretary per domain; no coordinators, volunteers or faculty advisor; no team on Home (D-027)                                            |
| Vercel project (old #8), Vercel Blob store (old #10)                | Hosting is Netlify, files are in Cloudflare R2 (D-025); #8–#10 now describe those accounts                                                                                        |

---

## Notes

- Items 7, 23 and 24 depend on people outside the build team and have the
  longest lead times, so they are worth chasing first even though some of their
  stages come later.
- Every third-party account (items 8–10, 13, 22) must be created on a
  **club-owned** account, never a personal one. Yearly handover depends on it.
