# Who can sign in

Admin access is **one setting** on Netlify: `ADMIN_EMAILS`, a comma-separated
list of Google accounts. There is no user list anywhere else and no passwords;
people sign in with Google. It is checked on every page, so a change takes
effect as soon as the site has redeployed.

## Add or remove an admin

1. Sign in to **Netlify** with the club account → the site → **Site
   configuration** → **Environment variables** → `ADMIN_EMAILS`.
2. Edit the value for the **Production** context, e.g.
   `president@gmail.com, webmaster@gmail.com`. Keep it to 2–3 people.
3. **Deploys** → **Trigger deploy** → **Deploy site**. When it is published
   (a minute or two), the new list applies.

Removed admins are locked out at their next click, even if they were signed in.

## Rules

- Use accounts the **club** controls where possible, so access does not leave
  with a student. Each must be a Google account (Gmail or Google Workspace).
- The Google sign-in itself (the "OAuth client") belongs to the club's Google
  Cloud project; setting it up is in [../SETUP_AUTH.md](../SETUP_AUTH.md).
- The panel's **Dashboard** → **Setup** card lists every service the site uses
  and whether its settings are filled in.
