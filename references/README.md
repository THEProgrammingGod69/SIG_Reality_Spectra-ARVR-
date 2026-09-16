# `references/` — design and animation inputs

Working material that shapes the build but is **never shipped**. This folder sits
outside `src/` and `public/`, so nothing here can end up in the browser bundle.

```
references/
  brand/        logo files, colour and font decisions          (Stage 1 + 3)
  animation/    recordings/links of motion to copy + NOTES.md  (Stage 2)
  design/       UI screenshots and mockups + NOTES.md          (Stage 3)
```

Heavy binaries (`.mp4`, `.mov`, `.webm`, `.gif`, `.zip`) are gitignored — keep
them locally and describe them in the matching `NOTES.md`, which **is** committed
so the intent behind each decision stays reviewable.
