# `src/content` — Git-edited content

The small amount of copy that changes rarely and needs no admin panel. Every file
is validated against a Zod schema **at build time**: a malformed field fails
`pnpm build` with a message naming the file and the field.

```
src/content/
  site.json       name, one-line intro, mission, vision, short and long "about us"
  domains.json    the club's domains, shown on /recruitment at all times
  contact.json    email, phone, address, map link, social links
```

Everything the committee changes week to week — events, event photos, team
members, recruitment status and sponsorship requests — is **not** here. It lives
in Redis and Blob and is edited at `/admin`.

Built in **Stage 4**.
