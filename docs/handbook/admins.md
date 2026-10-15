# Who can sign in

Admin access is **two settings** on Netlify (D-039):

- `ADMIN_EMAILS` — a comma-separated list of the people allowed in. There is
  no user list anywhere else.
- `ADMIN_PASSWORD` — the one admin password. Anyone on the list signs in at
  `/admin/login` with their email and this password. Once the club's Google
  sign-in is set up, they can also use **Sign in with Google**.

Both are checked on every page, so a change takes effect as soon as the site
has redeployed.

## Find the sign-in page

The footer of every public page has a small **Admin** link (bottom row, next
to "Back to top"). It opens `/admin/login`. Search engines are told not to
follow it, and the admin pages are never indexed.

## Add or remove an admin

1. Sign in to **Netlify** with the club account → the site → **Site
   configuration** → **Environment variables** → `ADMIN_EMAILS`.
2. Edit the value for the **Production** context, e.g.
   `president@gmail.com, webmaster@vit.edu`. Keep it to 2–3 people.
3. **Deploys** → **Trigger deploy** → **Deploy site**. When it is published
   (a minute or two), the new list applies.

Removed admins are locked out at their next click, even if they were signed in.

## Change the password

1. Netlify → **Environment variables** → `ADMIN_PASSWORD` → edit the
   **Production** value. Use a long passphrase (at least 12 characters, e.g.
   four unrelated words). Tick _Contains secret values_.
2. Trigger a deploy. Every admin signed in with the old password is signed out
   and signs in again with the new one.
3. Tell the other admins the new password in person or a private message —
   never in a group chat, an email thread or this repository.

The dashboard's **Setup** card shows a warning while the password is short or
common. Ten wrong attempts from one network lock sign-in for 15 minutes.

## Rules

- Use accounts the **club** controls where possible, so access does not leave
  with a student.
- The password lives only in Netlify (and in your own `.env.local` for local
  work). Never commit it, paste it in an issue or put it in a document.
- Google sign-in (the "OAuth client") belongs to the club's Google Cloud
  project; setting it up is in [../SETUP_AUTH.md](../SETUP_AUTH.md).
- The panel's **Dashboard** → **Setup** card lists every service the site uses
  and whether its settings are filled in.
