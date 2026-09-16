# `src/lib/auth`

Auth.js configuration: Google provider, JWT sessions, no database adapter.

Access control is the `ADMIN_EMAILS` environment variable and nothing else —
there is no user table and no password is ever stored. Yearly handover is done
by editing that one variable.

Two checks, not one:

1. `proxy.ts` guards `/admin/*` (note: Next.js 16 renamed `middleware` to `proxy`).
2. **Every server action re-checks the session itself.** Never trust the proxy alone.

Built in **Stage 6**.
