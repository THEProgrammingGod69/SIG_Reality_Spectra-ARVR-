# Open items

Inputs that are still outstanding. Each one blocks a specific stage, so the list is
ordered by when it is needed, not by size. Decisions already made are in
[`DECISIONS.md`](./DECISIONS.md), not here.

Update the status column as items land. Anything still open when its stage starts
should be raised rather than worked around with a placeholder that ships.

---

## Placeholder credentials to swap before go-live

The club's accounts are not available yet (Stage 6, D-030), so the site is
built with these placeholders. When the real details arrive, replace each one,
then confirm the dashboard's **Setup** card shows everything configured.

| What                        | Placeholder now                                                              | Replace with                                           | Guide                             |
| --------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------- |
| `ADMIN_EMAILS`              | `dryerisdry@gmail.com`, `mohan.arnav24@vit.edu`, `sig.vit@gmail.com` (D-039) | The club's 2–3 admin accounts (#14)                    | `SETUP_AUTH.md`                   |
| `ADMIN_PASSWORD`            | the short password the club chose — the Setup card says weak                 | A long passphrase (≥ 12 characters), set in Netlify    | `SETUP_AUTH.md`, D-039            |
| `AUTH_GOOGLE_ID`, `_SECRET` | empty — Google sign-in off, dev sign-in only locally                         | OAuth client on the club Google account (#13)          | `SETUP_AUTH.md`                   |
| `AUTH_SECRET`               | generated in your `.env.local` only                                          | A fresh secret per Netlify deploy context              | `SETUP_AUTH.md`                   |
| Upstash Redis variables     | empty — on Netlify, Netlify Blobs stores the data (D-039)                    | Club Upstash database (#9)                             | `SETUP_STORAGE.md`                |
| R2 variables                | empty — on Netlify, uploads go to Netlify Blobs (D-039)                      | Club R2 bucket and token (#10)                         | `SETUP_STORAGE.md`                |
| Turnstile keys              | empty — check off locally; the form is hidden on Netlify                     | Club Cloudflare Turnstile site (#22)                   | D-032                             |
| Analytics token             | empty — no analytics script loads                                            | Cloudflare Web Analytics site token (club account)     | `.env.example`, D-033             |
| `CRON_SECRET`               | empty                                                                        | A generated secret (Production context only)           | `GO_LIVE.md`, D-034               |
| Contact details             | "Coming soon" in `src/content/contact.json`                                  | Club email and phone (#7); address and map are set     | `pnpm check:launch` gate          |
| `DATA_BACKEND`              | `local` in your `.env.local` (records + uploads in `.data/`)                 | Remove once Upstash + R2 are set (D-031)               | `SETUP_STORAGE.md`                |
| Events and photos           | `[Demo]` events and club photos from `pnpm seed --demo`                      | Real events (#15) and photos (#18), added in the panel | `/admin/events`, `/admin/gallery` |
| Sample registration link    | The recruitment Google Form link, in demo events only                        | Each event's real link (typically VIERP, #16)          | `/admin/events`                   |
| Team                        | `[Demo]` core members and secretaries                                        | The real team (#19), added in the panel                | `/admin/team`                     |
| Recruitment settings        | Open with the form link in `dev` only (seeded)                               | Open in production with the form link (#20, #21)       | `/admin/recruitment`              |
| Sponsorship requests        | One `[Demo]` request in `dev`                                                | Nothing to swap: delete it, real requests arrive       | `/admin/sponsorships`             |

---

## Blocking Stage 2 — animation system and landing hero

| #   | Item                                          | Why it blocks                                                   | Status                                                                                                                                                                                                                                                                                                             |
| --- | --------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **A real mid-range Android phone** to test on | The 50+ fps low-tier budget cannot be signed off from a desktop | Open — Stage 2 is built; only this sign-off remains (Stage 9: a phone without GPU-accelerated WebGL now gets the static still, D-033). Open `/?hero-tier=low` on the phone (dev server on the LAN), scroll the hero, and note the fps; the low tier is tuned in `HERO_TIER_BUDGET` (`src/lib/motion/hero-tier.ts`) |

## Before go-live — remaining contact details

Stage 4 shipped with "Coming soon" placeholders for these (D-024). `pnpm check:launch`
fails until they are filled in `src/content/contact.json`.

| #   | Item                                                                                                                                    | Status                                                                                               |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 7   | **Official club email**, **phone**, **address** and a **Google Maps link** (embed optional); LinkedIn / GitHub org if the club has them | Open — Instagram, WhatsApp, the VIT Bibwewadi address and map supplied; email and phone still needed |

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

## Admin sign-in (Stage 6 built with placeholders)

| #   | Item                                                                                                     | Status                                                                                                    |
| --- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 13  | Google Cloud OAuth client under the **club** Google account, with localhost and production callback URLs | Open — Google sign-in is built and switches on with the keys (D-030)                                      |
| 14  | `ADMIN_EMAILS` — the 2–3 accounts that get admin access                                                  | Set: `dryerisdry@gmail.com`, `mohan.arnav24@vit.edu`, `sig.vit@gmail.com` with the admin password (D-039) |

## Events and gallery content (Stage 7 built with placeholders)

| #   | Item                                                                                      | Status                                                                                          |
| --- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 15  | 3–5 **past events** with dates, details and photos (consent checked) to seed the timeline | Open — `[Demo]` placeholders until supplied; add them in `/admin/events` (D-031)                |
| 16  | One example **registration link** (typically VIERP)                                       | Placeholder: the recruitment form link, in demo events only (D-031)                             |
| 17  | Preferred **poster aspect ratio**                                                         | Resolved: any ratio, shown whole in a 4:5 frame (D-031)                                         |
| 18  | A first batch of **standalone club photos** (consent checked), with a category for each   | Partly done — the Tesseract'26 and Unity workshop archive is in Git (D-039); more via the panel |

## Team, recruitment and sponsorships (Stage 8 built with placeholders)

| #   | Item                                                                                    | Status                                                                                                                                   |
| --- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 19  | **Team list**: name, position, photo; core team or secretary (and which domain) — D-027 | Open — `[Demo]` members until supplied; add them in `/admin/team` (D-032)                                                                |
| 20  | **Roles and responsibilities PDF** and the current **Google Form** link                 | Form link supplied: `https://forms.gle/WoDyL1mwWHnnKFs38`. The PDF shows as "coming soon" until uploaded in `/admin/recruitment` (D-028) |
| 21  | **Is recruitment open right now?**                                                      | Yes. It is now set only in `/admin/recruitment` (D-032): open it there with the form link when the live data store exists                |
| 22  | Cloudflare Turnstile site key and secret                                                | Open — recommended, not required: without both keys the form runs on its honeypot and rate limit (D-041)                                 |

## Go-live (Stage 10b) — step by step in [`GO_LIVE.md`](./GO_LIVE.md)

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
