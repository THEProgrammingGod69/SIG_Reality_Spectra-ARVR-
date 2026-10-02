import type { Category } from '@/lib/schemas/category';
import type { Event } from '@/lib/schemas/event';
import { GalleryPhotoInputSchema, GalleryPhotoSchema } from '@/lib/schemas/gallery';
import type { Image } from '@/lib/schemas/image';

import { createEntity, type RepositoryDeps } from './entity';
import { TAGS } from './tags';

/** Standalone club photos, uploaded in /admin/gallery. */
export function createGalleryRepository(deps: RepositoryDeps) {
  return createEntity(deps, {
    label: 'This photo',
    collection: 'gallery',
    input: GalleryPhotoInputSchema,
    record: GalleryPhotoSchema,
    id: (photo) => photo.id,
    score: (photo) => Date.parse(photo.createdAt),
    tags: [TAGS.gallery],
    files: (photo) => [{ url: photo.image.url, target: 'gallery-photo', recordId: photo.id }],
  });
}

export type GalleryRepository = ReturnType<typeof createGalleryRepository>;

/** One photo on the public gallery, whichever source it came from. */
export type GalleryItem = {
  /** Stable React key. */
  key: string;
  image: Image;
  category: Category;
  caption: string | null;
  /** The event's start for event photos, the upload time for club photos. */
  date: string;
  source: { kind: 'event'; eventId: string; eventTitle: string } | { kind: 'club' };
};

type GalleryPhotoLike = {
  id: string;
  image: Image;
  category: Category;
  caption: string | null;
  createdAt: string;
};

/**
 * The public gallery: photos of events on the timeline (with the event's
 * category) and standalone club photos, together, newest first.
 */
export function buildGallery(
  events: readonly Pick<
    Event,
    'id' | 'title' | 'category' | 'startsAt' | 'photos' | 'inTimeline'
  >[],
  photos: readonly GalleryPhotoLike[],
): GalleryItem[] {
  const fromEvents = events
    .filter((event) => event.inTimeline)
    .flatMap((event) =>
      event.photos.map((image): GalleryItem => ({
        key: `${event.id}:${image.url}`,
        image,
        category: event.category,
        caption: null,
        date: event.startsAt,
        source: { kind: 'event', eventId: event.id, eventTitle: event.title },
      })),
    );
  const fromClub = photos.map((photo): GalleryItem => ({
    key: photo.id,
    image: photo.image,
    category: photo.category,
    caption: photo.caption,
    date: photo.createdAt,
    source: { kind: 'club' },
  }));
  return [...fromEvents, ...fromClub].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}
