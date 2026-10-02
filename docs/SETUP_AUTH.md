# Setting up admin sign-in

Admins sign in to `/admin` with Google (D-030). Access is the `ADMIN_EMAILS`
allowlist and nothing else: no user table, no passwords. Handing the panel to
the next committee means editing that one variable.

Create the Google client with the **club's Google account**, never a personal
one. About 10 minutes.

---

## 1. Session secret

Every environment needs its own random secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Put it in `AUTH_SECRET` (`.env.local` locally; Netlify for each deploy
context). Changing it signs everyone out.

## 2. Google OAuth client

1. Go to <https://console.cloud.google.com> with the club account and create a
   project, e.g. `sig-reality-spectra`.
2. **APIs & Services → OAuth consent screen**: user type **External**, app name
   "SIG Reality Spectra admin", the club email as support and developer
   contact. No extra scopes are needed (sign-in uses email and profile only).
   Publish the app, or add each admin as a test user while it is in testing.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorised redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://<your-site>.netlify.app/api/auth/callback/google`
     - `https://<club-domain>/api/auth/callback/google` (once the domain exists)
4. Copy the **Client ID** → `AUTH_GOOGLE_ID` and the **Client secret** →
   `AUTH_GOOGLE_SECRET`.

Deploy previews have changing addresses that Google cannot list, so sign-in
with Google works on production and local development, not on previews.

## 3. Admins

`ADMIN_EMAILS` is a comma-separated list of the Google accounts allowed in:

```
ADMIN_EMAILS="secretary@vit.edu,webmaster@vit.edu"
```

Removing an address locks that person out at their next page load.

## 4. Netlify

Site configuration → Environment variables: add `AUTH_SECRET`,
`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` (tick _Contains secret values_ for the
secrets) and `ADMIN_EMAILS`, then redeploy. Never set `AUTH_DEV_SIGN_IN` on
Netlify: the build refuses it.

## Until Google is set up

`pnpm dev` shows a **development sign-in** on `/admin/login`: pick an address
from `ADMIN_EMAILS` and sign in without a password. It only needs
`AUTH_SECRET` and `ADMIN_EMAILS`, exists only on your computer, and is never
available on a deployed site. The dashboard's **Setup** card lists which
credentials are still missing.
