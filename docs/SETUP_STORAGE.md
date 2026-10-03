# Setting up the data accounts

The site keeps its admin-managed data in two services (D-025):

- **Upstash Redis**: events, gallery photos, team members, recruitment
  settings and sponsorship requests (small JSON records).
- **Cloudflare R2**: the files (event posters and photos, gallery and team
  photos, the recruitment roles PDF).

Both have free tiers that comfortably fit the club. Create every account with
the **club's Google account**, never a personal one, so the next committee
inherits it. You need about 15 minutes. No code changes are needed: everything
below ends up as environment variables.

## Before the accounts exist: local data mode

Set `DATA_BACKEND="local"` in `.env.local` (with `AUTH_SECRET` set) and the site
keeps its records and uploads in the gitignored `.data/` folder on your
computer (D-031). Everything works the same — admin saves, uploads, the public
pages — but nothing leaves your machine, and Netlify refuses to deploy with it.
`pnpm seed --demo` fills it with labelled sample events and photos.

When the accounts below are ready, set their variables and remove
`DATA_BACKEND` (or set it to `upstash`). Local data is not copied across: add
the real events and photos in the admin panel.

---

## 1. Upstash Redis

1. Go to <https://upstash.com> and sign in with the club Google account.
2. **Create Database** → **Redis**.
   - Name: `sig-reality-spectra`
   - Region: the one closest to where Netlify runs the site's functions (see
     Netlify → _Site configuration_ → _Build & deploy_ → _Functions region_).
   - Plan: **Free**.
3. On the database page, open the **REST API** section and copy:
   - `UPSTASH_REDIS_REST_URL` (starts with `https://`)
   - `UPSTASH_REDIS_REST_TOKEN`

One database serves production, previews and local development: every key is
prefixed with `DATA_NAMESPACE`, so they never see each other's data.

## 2. Cloudflare R2

1. Go to <https://dash.cloudflare.com>, sign in with the club account, and open
   **R2 Object Storage**. Cloudflare may ask for a payment method to enable R2
   even on the free tier (10 GB of storage, no download fees).
2. Copy the **Account ID** shown on the R2 overview page → `R2_ACCOUNT_ID`.
3. **Create bucket**: name `sig-reality-spectra-media`, location _Automatic_
   → `R2_BUCKET`.
4. Make the files publicly readable. In the bucket's **Settings**:
   - Either **Public Development URL** → _Enable_ and copy the
     `https://pub-….r2.dev` address,
   - or, once the club's domain is on Cloudflare, **Custom Domains** → connect
     e.g. `media.<club-domain>` (better for production: cached and not rate
     limited).

   Put that address, with no trailing slash, in `R2_PUBLIC_BASE_URL`.

5. Still in **Settings** → **CORS policy** → _Add CORS policy_, paste this,
   replacing the origins with the real ones:

   ```json
   [
     {
       "AllowedOrigins": [
         "http://localhost:3000",
         "https://<your-site>.netlify.app",
         "https://<club-domain>"
       ],
       "AllowedMethods": ["PUT"],
       "AllowedHeaders": ["Content-Type"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

   This lets the admin panel upload files straight from the browser. Uploads
   still need a short-lived signed URL that only a signed-in admin can get, so
   listing an origin here grants nothing by itself.

6. Back on the R2 overview: **Manage R2 API Tokens** → **Create API token**:
   - Permissions: **Object Read & Write**
   - Specify bucket: **only** `sig-reality-spectra-media`
   - Copy the **Access Key ID** → `R2_ACCESS_KEY_ID` and the **Secret Access
     Key** → `R2_SECRET_ACCESS_KEY`. The secret is shown once.

## 3. Local development (`.env.local`)

Copy `.env.example` to `.env.local` and fill in the Stage 5 section with the
values above, keeping `DATA_NAMESPACE="dev"`. Then:

```bash
pnpm test:live
```

This runs the storage contract tests and a full create → update → delete cycle
against the real Redis and R2, in a throwaway namespace that it cleans up. It
must pass before the accounts are considered done.

```bash
pnpm seed --demo
```

This fills your `dev` namespace with labelled sample events and team members
for trying the site out. Without `--demo` it only copies
`src/content/recruitment.json` into the recruitment settings.

## 4. Netlify

Netlify → the site → **Site configuration** → **Environment variables** →
_Add a variable_ for each of these. Tick _Contains secret values_ for the
token and the two R2 keys.

| Variable                   | Value                                                                                                                                                       |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UPSTASH_REDIS_REST_URL`   | from step 1                                                                                                                                                 |
| `UPSTASH_REDIS_REST_TOKEN` | from step 1                                                                                                                                                 |
| `R2_ACCOUNT_ID`            | from step 2                                                                                                                                                 |
| `R2_ACCESS_KEY_ID`         | from step 2                                                                                                                                                 |
| `R2_SECRET_ACCESS_KEY`     | from step 2                                                                                                                                                 |
| `R2_BUCKET`                | from step 2                                                                                                                                                 |
| `R2_PUBLIC_BASE_URL`       | from step 2                                                                                                                                                 |
| `DATA_NAMESPACE`           | **different per deploy context** — choose _Different value for each deploy context_: Production `prod`, Deploy Previews `preview`, Branch deploys `preview` |

The build refuses to deploy if production does not use `prod`, or if a preview
does (D-025), so a mistake here fails loudly instead of mixing test edits into
the live site.

Redeploy after adding the variables. Before Stage 8 switches the Recruitment
page to the admin-managed settings, run `pnpm seed` once against production
(temporarily set `DATA_NAMESPACE="prod"` in `.env.local`, run it, set it back)
so the current recruitment status carries over.
