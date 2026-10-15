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

/** One photo or clip on the public gallery, whichever source it came from. */
export type GalleryItem = {
  /** Stable React key. */
  key: string;
  /** The photo, or a clip's poster frame (what the grid tile shows). */
  image: Image;
  category: Category;
  caption: string | null;
  /**
   * The event's start for event photos, the upload time for club photos, when
   * it was taken for the archive. An ISO instant, so it always sorts.
   */
  date: string;
  /** A clip (archive only): the file and its length in seconds. */
  video: { src: string; duration: number } | null;
  /** The event or series an archive item belongs to, shown in the viewer. */
  album: string | null;
  /** The photographer, where their watermark is on the photo. */
  credit: string | null;
  source:
    { kind: 'event'; eventId: string; eventTitle: string } | { kind: 'club' } | { kind: 'archive' };
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
        video: null,
        album: null,
        credit: null,
        source: { kind: 'event', eventId: event.id, eventTitle: event.title },
      })),
    );
  const fromClub = photos.map((photo): GalleryItem => ({
    key: photo.id,
    image: photo.image,
    category: photo.category,
    caption: photo.caption,
    date: photo.createdAt,
    video: null,
    album: null,
    credit: null,
    source: { kind: 'club' },
  }));
  return mergeGallery(fromEvents, fromClub);
}

/** Newest first. The sort is stable: items from the same moment keep their order. */
export function sortGallery(items: readonly GalleryItem[]): GalleryItem[] {
  return [...items].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

/**
 * Several sources as one gallery, newest first. The /gallery page merges the
 * club archive (`src/content/archive.json`) with the data store's photos this
 * way, so the archive shows even where the store is missing or down.
 */
export function mergeGallery(...sources: readonly (readonly GalleryItem[])[]): GalleryItem[] {
  return sortGallery(sources.flat());
}
