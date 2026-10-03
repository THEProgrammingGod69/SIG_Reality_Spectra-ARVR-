# `scripts`

Command-line tools run with `pnpm`, outside Next.js. They load `.env.local`
themselves and run with the `react-server` condition, so they can use the same
server-only modules as the app.

| Script     | Command            | Does                                                                                                |
| ---------- | ------------------ | --------------------------------------------------------------------------------------------------- |
| `seed.mts` | `pnpm seed --demo` | Adds labelled `[Demo]` content and opens recruitment if never saved; never in `prod` (D-031, D-032) |

Stage 10 adds the backup restore script here.
