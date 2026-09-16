# `src/lib/schemas` — Zod schemas

One schema per admin-editable entity, and that single schema is used by the
admin form, the server action and the public renderer. There is never a second,
slightly different copy of a field's rules.

| File          | Schemas                                                            | Stage |
| ------------- | ------------------------------------------------------------------ | ----- |
| `content.ts`  | TeamMember, Project, Achievement, GalleryAlbum, Resource, SiteInfo | 4     |
| `event.ts`    | Event                                                              | 5     |
| `settings.ts` | SiteSettings                                                       | 5     |
| `enquiry.ts`  | SponsorEnquiry                                                     | 5     |

Export the inferred TypeScript types alongside each schema, and cover valid and
invalid cases with Vitest tests.
