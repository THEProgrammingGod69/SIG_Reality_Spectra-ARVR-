# `scripts`

Command-line tools run with `pnpm`, outside Next.js. They load `.env.local`
themselves and run with the `react-server` condition, so they can use the same
server-only modules as the app.

| Script     | Command              | Does                                                                                          |
| ---------- | -------------------- | --------------------------------------------------------------------------------------------- |
| `seed.mts` | `pnpm seed [--demo]` | Copies `recruitment.json` into Redis if unset; `--demo` adds sample records (never in `prod`) |

Stage 10 adds the backup restore script here.
