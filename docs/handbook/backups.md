# Backups and restoring

For whoever looks after the website. Design: `docs/DECISIONS.md` D-034.

## What happens every night

At 02:30 India time a Netlify scheduled function (`netlify/functions/nightly.mts`)
calls the site's nightly job (`/api/cron/nightly`, protected by `CRON_SECRET`):

1. **Backup**: every record — events, gallery photos, team, recruitment
   settings, sponsorship requests — is saved as one file in the R2 bucket,
   `prod/backups/<date>.json`. The newest **30** are kept.
2. **Clean-up**: uploaded files that no record uses any more (a replaced
   poster, a removed photo, an upload that was never saved) are deleted once
   they are a day old. It never deletes files a record still uses, and it
   refuses to run at all if it would delete more than half of the files — a
   sign that something is misconfigured.

Photos themselves are not copied into the backup: they stay in R2, and a
deleted record's photos are kept for a day before the clean-up removes them.
**So restore within a day if photos matter** — after that, a restored event
comes back with its details but without the photos that were deleted.

## Check that it runs

Netlify → the site → **Logs & metrics** → **Functions** → `nightly`: each night
logs a line like `Backed up 42 records … swept 0 of 53 files`. Failures log
`[nightly] Failed …` with the reason.

## Tools (on a computer with the project and the production settings)

Put the production values in `.env.local` (from Netlify's environment
variables, with `DATA_NAMESPACE="prod"`), then:

```bash
pnpm data backups
```

lists the stored backups, newest first.

```bash
pnpm data restore 2026-10-04
```

shows what that backup holds and changes nothing. To really restore:

```bash
pnpm data restore 2026-10-04 --yes --production
```

Restoring puts the backup's records back exactly as they were (their own dates
and authors) and leaves records that are not in the backup alone. Then reload
the public pages; they show it within the hour.

```bash
pnpm data backup
```

takes a backup now — do this before any risky change.

```bash
pnpm data sweep --dry-run
```

lists the files the clean-up would delete, without deleting them.

Afterwards, put `.env.local` back to your development settings.
