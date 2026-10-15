# Yearly handover checklist

When the committee changes. The outgoing person who looks after the website
goes through this with the incoming one — ideally in one sitting, both signed
in.

## Accounts the club owns

Every service must be on a **club** account, never a student's personal one.
Hand over each login (and its two-factor recovery) to the new committee:

- [ ] **GitHub** — the club organisation that holds the code
- [ ] **Netlify** — the hosting, and every setting below
- [ ] **Upstash** — the database
- [ ] **Cloudflare** — R2 (photos and backups), Turnstile (spam check) and Web Analytics
- [ ] **Google Cloud** — the sign-in ("OAuth client")
- [ ] **The domain name** and its DNS (with the college if it is theirs)

## Access

- [ ] Update `ADMIN_EMAILS` on Netlify to the new admins, set a new
      `ADMIN_PASSWORD`, and redeploy ([admins.md](./admins.md)). Remove the
      outgoing ones.
- [ ] Each new admin signs in once to check.
- [ ] Generate a new `CRON_SECRET` and `AUTH_SECRET` on Netlify
      (`openssl rand -base64 32` each), so departing people's copies stop
      working, and redeploy. Everyone has to sign in again; that is expected.

## Content

- [ ] **Team**: remove last year's members, add the new core team and
      secretaries ([team.md](./team.md)).
- [ ] **Recruitment**: open or close it, update the form link and PDF
      ([recruitment.md](./recruitment.md)).
- [ ] **Contact details**: if the club email or phone changes, edit
      `src/content/contact.json` in GitHub (see `src/content/README.md`).
- [ ] **Sponsorships**: answer or close everything still _New_.

## Health

- [ ] The nightly backup ran this week ([backups.md](./backups.md)).
- [ ] Dashboard → **Setup** shows every service configured.
- [ ] The public site loads on a phone, and an admin save shows on it.
- [ ] Note the new maintainer's name in `docs/OPEN_ITEMS.md` (#25).
