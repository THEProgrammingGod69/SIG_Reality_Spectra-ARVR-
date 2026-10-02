import { z } from 'zod';

import { httpsUrl, text } from './fields';

/**
 * An uploaded image as records store it: event posters and photos, gallery
 * photos and team photos.
 *
 * Width and height are measured in the browser before upload, so the public
 * pages can reserve the exact space (no layout shift) and pick a crop. Alt
 * text is required: every image the club publishes is described.
 *
 * The schema only checks the URL's shape. That it points at our own storage,
 * under the record it is attached to, is checked by the data layer when the
 * record is saved (`src/lib/data/media.ts`).
 */
export const ImageSchema = z.object({
  url: httpsUrl,
  alt: text(3, 200),
  width: z.int().min(1).max(20_000),
  height: z.int().min(1).max(20_000),
});

export type Image = z.infer<typeof ImageSchema>;
