import type { z } from 'zod';

import { CategorySchema } from './category';
import { entitySchemas, recordId, text } from './fields';
import { ImageSchema } from './image';

/**
 * A standalone club photo, uploaded in /admin/gallery.
 *
 * The public gallery also shows the photos of every event on the timeline;
 * those live inside the event record and take the event's category, so the
 * two sources share one category list (`./category.ts`).
 */
const { input, record } = entitySchemas({
  id: recordId,
  image: ImageSchema,
  category: CategorySchema,
  caption: text(1, 120).nullable().default(null),
});

export const GalleryPhotoInputSchema = input;
export const GalleryPhotoSchema = record;

export type GalleryPhotoInput = z.input<typeof GalleryPhotoInputSchema>;
export type GalleryPhoto = z.output<typeof GalleryPhotoSchema>;
