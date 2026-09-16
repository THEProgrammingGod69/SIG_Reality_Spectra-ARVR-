# `src/content` — Git-edited content

Content a coordinator can change without touching component code. Every file is
validated against a Zod schema **at build time**: a malformed field fails
`pnpm build` with a message naming the file and the field.

```
src/content/
  about.mdx                long-form About copy
  team.json                current core team + alumni
  projects/*.json          one file per project
  achievements.json        grouped by academic year at render time
  gallery/*.json           one file per album
  resources.json           learning material and links
```

Admin-managed data (events, recruitment settings, sponsor enquiries) does **not**
live here — it lives in Redis and is edited at `/admin`.

Built in **Stage 4**. See `docs/CONTENT_GUIDE.md` (Stage 10) for copy-paste templates.
