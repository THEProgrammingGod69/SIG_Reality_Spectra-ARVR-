# `src/lib/auth`

Admin sign-in and the session checks (D-030). Auth.js (`next-auth@5.0.0-beta.32`,
pinned): email + password and Google providers, JWT sessions for 8 hours, no
database adapter.

Access control is the `ADMIN_EMAILS` environment variable — there is no user
table. The password sign-in adds one shared `ADMIN_PASSWORD`, kept only in the
environment (never in the code, a test or `.env.example`) and never stored
anywhere else. Both are re-checked on every request, so removing an address
locks that admin out at once, and changing the password signs every password
session out. Yearly handover is done by editing those variables. Setup:
`docs/SETUP_AUTH.md`.

| File               | Does                                                                                                                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `policy.ts`        | The pure rules: allowlist match, development sign-in switch, `authSetup()`, safe callback paths, `cookieRemovalsOnly()`, the password match, fingerprint and weakness check, `admittedEmail()` |
| `base.ts`          | The session settings both sides share (secret, JWT, pages, `jwt`/`session` callbacks), `setup` (what sign-in can do in this environment), the password fingerprint                             |
| `proxy-auth.ts`    | Auth.js with no providers, for `src/proxy.ts`: decodes the session only, so the data layer never reaches the proxy's (edge) bundle (D-041)                                                     |
| `session-check.ts` | `adminFromSession()`: the allowlist and password-fingerprint re-check, shared by the proxy and the server                                                                                      |
| `config.ts`        | Auth.js: providers, the `signIn` callback, the attempt limit in the password `authorize()` (uses the data layer; never imported by the proxy)                                                  |
| `session.ts`       | `getAdminSession()` (cached per request), `requireAdmin()`                                                                                                                                     |
| `admin-action.ts`  | `adminAction()` — the wrapper every admin Server Action uses                                                                                                                                   |
| `actions.ts`       | Server Actions: password sign-in, Google sign-in, development sign-in, sign-out                                                                                                                |
| `errors.ts`        | `NotSignedInError` (client-safe)                                                                                                                                                               |

## Three locks (rule 8)

1. `src/proxy.ts` sends signed-out visitors to `/admin/login`, remembering the
   page they asked for (only ever an `/admin` path: no open redirect). It never
   re-issues the session cookie (only removals pass), so a prefetch answered
   after "Sign out" cannot sign the admin back in; sessions last a fixed 8 hours
   from sign-in (D-032).
2. The panel layout (`src/app/admin/(panel)/layout.tsx`) checks again before
   rendering anything.
3. **Every Server Action re-checks** by wrapping its body in `adminAction()`;
   `/api/admin/upload` calls `getAdminSession()` itself.

```ts
'use server';
export async function saveEvent(input: EventInput, expectedUpdatedAt: string) {
  return adminAction((admin) =>
    repositories().events.update(input.id, expectedUpdatedAt, input, admin.email),
  );
}
```

`adminAction()` returns an `ActionResult` (`src/lib/action-result.ts`): data on
success, or a message, a reason (`conflict`, `invalid`, `signed-out`, …) and
per-field issues. On the client, `useToast().notify(result, 'Saved')` reports it;
a `signed-out` failure's notification offers "Sign in again" in a new tab.

## The email + password sign-in

An allowlisted email plus `ADMIN_PASSWORD` (provider id `password`). On wherever
`AUTH_SECRET`, `ADMIN_EMAILS` and `ADMIN_PASSWORD` are all set — including
Netlify, where it is the way in until Google sign-in is configured.

- **Comparison**: SHA-256 of both sides, compared with `timingSafeEqual`, so
  timing reveals neither the password nor its length. A wrong password and an
  email not on the allowlist get the same answer, "Wrong email or password."
- **Attempt limit**: inside `authorize()`, so it covers the sign-in page's
  Server Action and a direct POST to `/api/auth/callback/password` alike. At
  most 10 attempts per 15 minutes per client address
  (`x-nf-client-connection-ip`, else the first `x-forwarded-for` entry) and 20
  per email (`allowSignInAttempt()` in `src/lib/data`: the store's `hit()`
  counters, hashed keys; in memory when there is no store or it fails). Over
  the limit Auth.js gets `TooManyAttempts` (`code: 'too_many_attempts'`) and
  the page says to wait 15 minutes.
- **Password changes**: a password session carries `passwordFingerprint()` (an
  HMAC of the password under `AUTH_SECRET`, never the password). Every request
  compares it with the current password's, so changing or removing
  `ADMIN_PASSWORD` ends those sessions at once.
- **Weak passwords** still work — a deploy must never lock the club out — but
  the dashboard's Setup card warns while it is shorter than 12 characters or a
  well-known password (`isWeakPassword()`). The password itself is never shown.

## The development sign-in

Signs in as an allowlisted email without a password, for working on the panel
before Google sign-in is configured. On under `next dev`, or with
`AUTH_DEV_SIGN_IN=true` (the e2e suite's production-build run). Never on
Netlify: `env.ts` fails a deploy that sets the flag, the option is off wherever
`CONTEXT` is set, and a session it created is rejected wherever it is off.
