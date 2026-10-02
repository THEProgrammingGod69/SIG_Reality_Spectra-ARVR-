# `src/lib/auth`

Admin sign-in and the session checks (D-030). Auth.js (`next-auth@5.0.0-beta.32`,
pinned): Google provider, JWT sessions for 8 hours, no database adapter.

Access control is the `ADMIN_EMAILS` environment variable and nothing else —
there is no user table and no password is ever stored. It is re-checked on
every request, so removing an address locks that admin out at once. Yearly
handover is done by editing that one variable. Setup: `docs/SETUP_AUTH.md`.

| File              | Does                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| `policy.ts`       | The pure rules: allowlist match, development sign-in switch, `authSetup()`, safe callback paths |
| `config.ts`       | Auth.js: providers, callbacks, `setup` (what sign-in can do in this environment)                |
| `session.ts`      | `getAdminSession()` (cached per request), `requireAdmin()`, `adminFromSession()`                |
| `admin-action.ts` | `adminAction()` — the wrapper every admin Server Action uses                                    |
| `actions.ts`      | Server Actions: Google sign-in, development sign-in, sign-out                                   |
| `errors.ts`       | `NotSignedInError` (client-safe)                                                                |

## Three locks (rule 8)

1. `src/proxy.ts` sends signed-out visitors to `/admin/login`, remembering the
   page they asked for (only ever an `/admin` path: no open redirect).
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
per-field issues. On the client, `useToast().notify(result, 'Saved')` reports it.

## The development sign-in

Signs in as an allowlisted email without a password, for working on the panel
before Google sign-in is configured. On under `next dev`, or with
`AUTH_DEV_SIGN_IN=true` (the e2e suite's production-build run). Never on
Netlify: `env.ts` fails a deploy that sets the flag, the option is off wherever
`CONTEXT` is set, and a session it created is rejected wherever it is off.
