'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { Icon } from '@/components/ui/icon';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/cn';
import type { Image as StoredImage } from '@/lib/schemas/image';

export type GridPhoto = {
  key: string;
  image: StoredImage;
  /** Shown under the photo in the viewer, e.g. its caption or event. */
  caption?: string | null;
};

type PhotoGridProps = {
  photos: readonly GridPhoto[];
  /** Tiles shown; the rest are reachable in the viewer ("+N" on the last tile). */
  limit?: number;
  /** Tiles loaded straight away: the first row when the grid opens the page. */
  eager?: number;
  /** Tile width floor; the grid fits as many as the row allows (rule 9). */
  tile?: 'sm' | 'md';
  className?: string;
};

const tiles = {
  sm: 'grid-cols-[repeat(auto-fill,minmax(min(100%,5.5rem),1fr))]',
  md: 'grid-cols-[repeat(auto-fill,minmax(min(100%,14rem),1fr))]',
} as const;

/**
 * How wide each tile renders, so the browser fetches the right image: `md`
 * tiles (14rem minimum) are one full-width column on phones, two from 30rem,
 * and about 18rem on a full-width desktop row.
 */
const TILE_SIZES = {
  sm: '8rem',
  md: '(min-width: 64rem) 18rem, (min-width: 30rem) 50vw, 100vw',
} as const;

/**
 * Square tiles, cropped to the centre so photos of any shape line up; opening
 * one shows it whole, with the rest one keypress away.
 */
export function PhotoGrid({ photos, limit, eager = 0, tile = 'md', className }: PhotoGridProps) {
  const [open, setOpen] = useState<number | null>(null);
  const shown = limit === undefined ? photos : photos.slice(0, limit);
  const hidden = photos.length - shown.length;

  return (
    <>
      <ul className={cn('grid gap-2', tiles[tile], className)}>
        {shown.map((photo, index) => {
          const more = hidden > 0 && index === shown.length - 1;
          return (
            <li key={photo.key}>
              <button
                type="button"
                onClick={() => setOpen(index)}
                className="group relative block aspect-square w-full cursor-pointer overflow-hidden rounded-control bg-(--color-surface-raised) focus-visible:outline-offset-2"
              >
                <Image
                  src={photo.image.url}
                  alt={photo.image.alt}
                  fill
                  sizes={TILE_SIZES[tile]}
                  // The first tile of a grid that opens the page is its largest
                  // paint: fetch it first. The rest of the first row loads at once.
                  {...(index === 0 && eager > 0
                    ? { preload: true }
                    : { loading: index < eager ? 'eager' : 'lazy' })}
                  className="object-cover transition-transform duration-(--dur-medium) ease-out-expo group-hover:scale-105"
                />
                {more ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-(--color-void)/60 font-display text-display-sm text-(--color-text)">
                    +{hidden + 1}
                    <span className="sr-only"> more photos</span>
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      {open !== null ? (
        <PhotoViewer photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
      ) : null}
    </>
  );
}

function PhotoViewer({
  photos,
  index,
  onIndex,
  onClose,
}: {
  photos: readonly GridPhoto[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const photo = photos[index]!;
  const step = (by: number) => onIndex((index + by + photos.length) % photos.length);
  const many = photos.length > 1;

  // Arrow keys move through the photos wherever focus is inside the viewer.
  useEffect(() => {
    if (!many) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') onIndex((index + 1) % photos.length);
      if (event.key === 'ArrowLeft') onIndex((index - 1 + photos.length) % photos.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, many, onIndex, photos.length]);

  return (
    <Modal
      open
      onClose={onClose}
      title={`Photo ${index + 1} of ${photos.length}`}
      description={photo.caption ?? undefined}
      className="max-w-5xl"
    >
      <div className="flex flex-col gap-4">
        <div className="relative flex justify-center">
          <Image
            src={photo.image.url}
            alt={photo.image.alt}
            width={photo.image.width}
            height={photo.image.height}
            sizes="(min-width: 64rem) 60rem, 100vw"
            // The photo someone just opened: never wait for it to be "near".
            loading="eager"
            className="max-h-[70dvh] w-auto rounded-control object-contain"
          />
        </div>
        {many ? (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => step(-1)}
              className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-(--color-border-strong) text-(--color-text)"
            >
              <Icon icon={ChevronLeft} size="md" label="Previous photo" />
            </button>
            <p className="line-clamp-2 text-center text-body-sm text-(--color-muted)">
              {photo.image.alt}
            </p>
            <button
              type="button"
              onClick={() => step(1)}
              className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-(--color-border-strong) text-(--color-text)"
            >
              <Icon icon={ChevronRight} size="md" label="Next photo" />
            </button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
