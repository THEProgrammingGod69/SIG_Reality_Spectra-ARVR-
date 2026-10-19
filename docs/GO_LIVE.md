# Going live (Stage 10b)

The site is built and tested on placeholders (Stages 1–10a). This is the
checklist for the one sitting in which it moves onto the club's own accounts
and goes public. Do the steps in order; each says how to check it worked. The
full list of placeholders is at the top of [`OPEN_ITEMS.md`](./OPEN_ITEMS.md).

Every account below must be created on a **club-owned** login, never a
personal one ([handbook/yearly-handover.md](./handbook/yearly-handover.md)).

## Right now: the admin panel on the existing site (D-039)

Before any of the accounts below exist, the club's current Netlify site
(`sigarvr`) runs the admin panel on **Netlify Blobs** with the **password
sign-in**. On Netlify → Site configuration → Environment variables, set for
**all deploy contexts** (tick _Contains secret values_ for the secrets):

| Variable         | Value                                                        |
| ---------------- | ------------------------------------------------------------ |
| `AUTH_SECRET`    | `openssl rand -base64 32` (a different one for production)   |
| `ADMIN_EMAILS`   | `dryerisdry@gmail.com,mohan.arnav24@vit.edu`                 |
| `ADMIN_PASSWORD` | the club's admin password (a long passphrase is recommended) |

Leave `DATA_BACKEND` and the Upstash/R2 variables unset, then **Trigger
deploy**. Check: the footer's **Admin** link opens the sign-in page, both
admins can sign in, the dashboard's Setup card shows _Netlify Blobs_, and a
saved event appears on `/events` without a redeploy. The steps below replace
Blobs and add Google later; the password sign-in can stay.

## 0. Before you start

- [ ] Confirmed with the club / VIT that hosting outside the college's systems
      is acceptable (OPEN_ITEMS #24).
- [ ] The domain name is chosen and you can edit its DNS (#23).
- [ ] The contact details are known (#7): email, phone, address, map link.
- [ ] Netlify site exists on the club account, connected to the club's GitHub
      repository (#8).

## 1. Data accounts — [SETUP_STORAGE.md](./SETUP_STORAGE.md)

- [ ] Upstash Redis database (#9) and Cloudflare R2 bucket, token, public URL
      and CORS rule (#10).
- [ ] Put them in `.env.local` with `DATA_NAMESPACE="dev"`, remove
      `DATA_BACKEND`, and run `pnpm test:live`: it must pass and report that
      nothing was left behind.

## 2. Sign-in — [SETUP_AUTH.md](./SETUP_AUTH.md)

- [ ] Google OAuth client on the club's Google Cloud project, with the
      production callback URL `https://<domain>/api/auth/callback/google` (#13).
- [ ] The 2–3 admin accounts (#14) and a long `ADMIN_PASSWORD` (D-039).

## 3. The other services

- [ ] Cloudflare **Turnstile**: a widget for the domain → site key and secret (#22).
- [ ] Cloudflare **Web Analytics**: add the site (manual setup) → token.
- [ ] `CRON_SECRET` and `AUTH_SECRET`: generate each with
      `openssl rand -base64 32`; different values for Production and previews.

## 4. Netlify environment variables

Site configuration → Environment variables. Set **per deploy context**:

| Variable                                                                                       | Production           | Deploy previews / branch deploys |
| ---------------------------------------------------------------------------------------------- | -------------------- | -------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                                                                         | `https://<domain>`   | leave unset (the default)        |
| `DATA_NAMESPACE`                                                                               | leave unset (`prod`) | leave unset (`preview`)          |
| `UPSTASH_REDIS_REST_URL`, `_TOKEN`                                                             | club database        | same database                    |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL` | club bucket          | same bucket                      |
| `AUTH_SECRET`                                                                                  | its own secret       | a different secret               |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`                                                         | the OAuth client     | the OAuth client                 |
| `ADMIN_EMAILS`                                                                                 | the club admins      | the club admins                  |
| `ADMIN_PASSWORD`                                                                               | a long passphrase    | the same, or a different one     |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`                                       | the widget           | the widget                       |
| `NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN`                                                           | the token            | leave unset                      |
| `CRON_SECRET`                                                                                  | its own secret       | leave unset                      |

**Never set** `DATA_BACKEND=local` or `AUTH_DEV_SIGN_IN` on Netlify: a deployed
site ignores both and lists them on the dashboard's Setup card (D-041). With the Upstash variables set, the site uses
Upstash + R2; without them, Netlify Blobs (D-039). `DATA_NAMESPACE` follows the deploy context when unset
(D-036); if it is set to anything that would mix production and previews, it
is ignored with a warning (D-041).

## 5. Content in the repository

- [ ] Fill `src/content/contact.json`; `pnpm check:launch` must pass.
- [ ] Commit and push. The deploy preview builds on the `preview` namespace.

## 6. Test the deploy preview

- [ ] Run the public tests against it (PowerShell):

  ```powershell
  $env:PLAYWRIGHT_BASE_URL="https://deploy-preview-N--<site>.netlify.app"; pnpm test:deployed
  ```

  Admin tests skip themselves there (deployed sites have no development
  sign-in). Then sign in with the password or Google on the preview and add a test event,
  check it on /events, and delete it.

## 7. Production

- [ ] Merge, let Netlify publish, and add the domain (Netlify → Domain
      management; follow its DNS instructions; HTTPS is automatic).
- [ ] Sign in at `https://<domain>/admin` with each admin account.
- [ ] Dashboard → **Setup**: every service shows _Configured_; no "Local data"
      banner.
- [ ] **Save something and reload the public page: it shows at once, with no
      redeploy** (OPEN_ITEMS #26). Try it twice, a few minutes apart.
- [ ] **Recruitment**: open it with the club's form link
      (`https://forms.gle/WoDyL1mwWHnnKFs38`, #20) — a new store starts closed.
- [ ] Add the real **team** (#19), **events** (#15), **photos** (#18) and the
      **roles PDF** (#20) — [the handbook](./handbook/README.md). No demo
      data exists in production (`pnpm seed --demo` refuses `prod`).
- [ ] Send a test request from /contact (Turnstile must appear), see it in
      **Sponsorships**, delete it.
- [ ] Run `pnpm test:deployed` against `https://<domain>`.
- [ ] Next morning: Netlify → Functions → `nightly` logged a backup
      ([handbook/backups.md](./handbook/backups.md)); `pnpm data backups`
      with the production settings lists it.
- [ ] Share the site: check a link preview (WhatsApp, LinkedIn) shows the
      page's share image.
- [ ] Android phone: open the home page and check the hero runs smoothly (#1).

## 8. Afterwards

- [ ] Tick off every item in `OPEN_ITEMS.md`, and remove the placeholder rows
      from its swap list and from CLAUDE.md §10.
- [ ] Record the maintainer for next year (#25) and walk them through the
      [handbook](./handbook/README.md).
- [ ] Tag the release: `git tag -a stage-10b`.
