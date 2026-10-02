/**
 * Cache tags. Public reads tag their `'use cache'` result with these, and every
 * write refreshes the tags of what it changed (rule 10) — both import them from
 * here, so a read and its write can never disagree on a tag's spelling.
 *
 * Sponsorship requests have no tag: they are admin-only and never cached.
 */
export const TAGS = {
  events: 'events',
  gallery: 'gallery',
  team: 'team',
  recruitment: 'recruitment',
} as const;

export type CacheTag = (typeof TAGS)[keyof typeof TAGS];

/** Refreshes cached reads after a write. The app passes Next.js's `updateTag`. */
export type Invalidate = (tags: readonly CacheTag[]) => void;
