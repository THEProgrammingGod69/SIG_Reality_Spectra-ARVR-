# `src/lib/auth`

Auth.js configuration: Google provider, JWT sessions, no database adapter.

Access control is the `ADMIN_EMAILS` environment variable and nothing else —
there is no user table and no password is ever stored. Yearly handover is done
by editing that one variable.

`session.ts` — `getAdminSession()`, the one check every admin entry point calls.
Until Stage 6 it is a stub that always answers "not signed in", so the upload
route (Stage 5) fails closed. Stage 6 replaces its body and keeps its signature.

Two checks, not one:

1. `proxy.ts` guards `/admin/*` (note: Next.js 16 renamed `middleware` to `proxy`).
2. **Every server action re-checks the session itself.** Never trust the proxy alone.

Built in **Stage 6**.
