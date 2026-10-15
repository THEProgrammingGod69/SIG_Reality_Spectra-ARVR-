import { z } from 'zod';

import { CategorySchema } from './category';
import { instant, text } from './fields';

/**
 * The club's archive (`src/content/archive.json`): photos and short clips from
 * past events, committed under `public/archive/` and edited in Git, not in the
 * admin panel. The gallery shows them together with the store's photos, under
 * the same categories (D-026).
 *
 * Parsed once at build time by `src/lib/content.ts`, so a bad entry fails
 * `pnpm build` with the file and field named.
 */

/**
 * A file in `public/archive/<folder>/`, as the site serves it: lowercase words
 * joined by hyphens, one folder deep, nothing that could climb out (`..`).
 */
const archiveFile = (extensions: readonly string[], message: string) =>
  z
    .string()
    .regex(
      new RegExp(`^/archive/(?!.*\\.\\.)[a-z0-9-]+/[a-z0-9-]+\\.(${extensions.join('|')})$`),
      message,
    );

/** A photo, or a clip's poster frame. */
export const archiveImagePath = archiveFile(
  ['webp', 'jpg', 'png', 'avif'],
  'An image in public/archive/<folder>/, e.g. /archive/workshops/name.webp',
);

/** A clip: H.264 MP4, so every browser plays it. */
export const archiveVideoPath = archiveFile(
  ['mp4'],
  'A clip in public/archive/<folder>/, e.g. /archive/workshops/name.mp4',
);

/** Pixel size of the photo, or of the clip (and its poster). */
const dimension = z.int().positive().max(20_000);

/** Fields every entry has, photo or clip. Lengths match the gallery's layouts. */
const common = {
  width: dimension,
  height: dimension,
  category: CategorySchema,
  /** The event or series it belongs to, shown in the viewer. */
  album: text(3, 60).optional(),
  /** When it was taken; the gallery sorts by it, newest first. */
  date: instant,
  alt: text(3, 200),
  /** One line under the tile and in the viewer (line-clamped, rule 9). */
  caption: text(3, 120),
  /** The photographer or studio, as their watermark names them. */
  credit: text(3, 80).optional(),
};

export const ArchiveEntrySchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('photo'), src: archiveImagePath, ...common }),
  z.object({
    kind: z.literal('video'),
    src: archiveVideoPath,
    /** A still from the clip: the grid tile and what the player shows first. */
    poster: archiveImagePath,
    /** Length in seconds, shown on the tile. */
    duration: z.number().positive({ error: 'The clip length in seconds' }),
    ...common,
  }),
]);

export const ArchiveSchema = z.array(ArchiveEntrySchema).superRefine((entries, ctx) => {
  const seen = new Set<string>();
  entries.forEach((entry, index) => {
    if (seen.has(entry.src)) {
      ctx.addIssue({
        code: 'custom',
        path: [index, 'src'],
        message: `Duplicate src "${entry.src}"`,
      });
    }
    seen.add(entry.src);
  });
});

export type ArchiveEntry = z.output<typeof ArchiveEntrySchema>;
