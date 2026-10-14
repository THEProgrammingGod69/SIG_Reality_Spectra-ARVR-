'use client';

import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { prefersReducedMotion } from '@/components/motion/use-reduced-motion';
import { Icon } from '@/components/ui/icon';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/cn';
import { gsap, gsapEase, ScrollTrigger } from '@/lib/motion/gsap';
import { reachablePoint } from '@/lib/motion/scroll-point';
import { readMotionTokens } from '@/lib/motion/tokens';
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
  /**
   * Lead with a double-size first tile from `md` up (D-037) — the gallery's
   * opening photo. Square like the rest, so any photo still fits (D-031).
   */
  feature?: boolean;
  /**
   * Tiles from this index on rise into place, `--stagger` apart (D-037): 0
   * after a filter change, the old count after "Show more". `null` (the
   * default, and the first load) shows every tile at once.
   */
  enterFrom?: number | null;
  className?: string;
};

const tiles = {
  sm: 'grid-cols-[repeat(auto-fill,minmax(min(100%,5.5rem),1fr))]',
  md: 'grid-cols-[repeat(auto-fill,minmax(min(100%,14rem),1fr))]',
} as const;

/**
 * How wide each tile renders, so the browser fetches the right image: `md`
 * tiles (14rem minimum) are one full-width column on phones, two from 30rem,
 * and about 18rem on a full-width desktop row; a featured tile is two of them.
 */
const TILE_SIZES = {
  sm: '8rem',
  md: '(min-width: 64rem) 18rem, (min-width: 30rem) 50vw, 100vw',
  feature: '(min-width: 64rem) 36rem, (min-width: 48rem) 66vw, 100vw',
} as const;

/** Entrances past this many tiles share the last delay, so a long batch never drags. */
const MAX_STAGGER_STEPS = 12;

/** A tile's curtain lifts when the tile's top is this far down the viewport. */
const DEVELOP_AT = 0.92;
/** How much closer the photo starts while its curtain is down. */
const DEVELOP_ZOOM = 1.15;

/**
 * Develops the tiles below the fold as the reader reaches them (D-038): each
 * tile waits under a curtain of the lab's surface with a line of spectrum
 * light on its lower edge, and the curtain lifts (`scaleY`) while the photo
 * settles back from slightly closer (`scale`) — row by row, a stagger apart.
 *
 * Tiles already on screen at load are never covered, so the first row (and
 * the page's largest paint) shows at once; nothing is covered without
 * JavaScript or under reduced motion, or for tiles that arrive with their own
 * entrance (after a filter change or "Show more"). Returns the cleanup.
 */
function developOnScroll(list: HTMLElement): () => void {
  const tiles = Array.from(list.querySelectorAll<HTMLElement>(':scope > li:not(.animate-enter)'));
  const waiting = tiles.filter((tile) => tile.getBoundingClientRect().top >= window.innerHeight);
  if (waiting.length === 0) return () => {};

  const tokens = readMotionTokens();
  const curtains = (batch: Element[]) => batch.map((tile) => tile.querySelector('[data-curtain]'));
  const photos = (batch: Element[]) => batch.map((tile) => tile.querySelector('img'));

  const context = gsap.context(() => {
    gsap.set(curtains(waiting), { scaleY: 1 });
    gsap.set(photos(waiting), { scale: DEVELOP_ZOOM });
    ScrollTrigger.batch(waiting, {
      once: true,
      start: (self: ScrollTrigger) => reachablePoint(self.trigger as Element, 'top', DEVELOP_AT)(),
      onEnter: (batch) => {
        const ease = gsapEase(tokens, 'outExpo');
        gsap.to(curtains(batch), {
          scaleY: 0,
          duration: tokens.dur.long,
          ease,
          stagger: tokens.stagger,
        });
        gsap.to(photos(batch), {
          scale: 1,
          duration: tokens.dur.long * 1.5,
          ease,
          stagger: tokens.stagger,
          clearProps: 'transform',
        });
      },
    });
  }, list);

  return () => context.revert();
}

/**
 * Square tiles, cropped to the centre so photos of any shape line up; opening
 * one shows it whole, with the rest one keypress away. Under the pointer (or
 * keyboard focus) a tile eases closer and its caption rises in (D-037), and
 * the other tiles dim (`focus-dim`, D-038). Tiles below the fold develop from
 * under a curtain as the reader reaches them (`developOnScroll`).
 */
export function PhotoGrid({
  photos,
  limit,
  eager = 0,
  tile = 'md',
  feature = false,
  enterFrom = null,
  className,
}: PhotoGridProps) {
  const [open, setOpen] = useState<number | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const shown = limit === undefined ? photos : photos.slice(0, limit);
  const hidden = photos.length - shown.length;

  // The curtains are set once, for the tiles there at mount (see developOnScroll).
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || prefersReducedMotion()) return;
    return developOnScroll(list);
  }, []);

  return (
    <>
      <ul
        ref={listRef}
        className={cn(
          'grid gap-2 focus-dim',
          tiles[tile],
          feature && 'md:grid-flow-dense',
          className,
        )}
      >
        {shown.map((photo, index) => {
          const more = hidden > 0 && index === shown.length - 1;
          const featured = feature && index === 0;
          const entering = enterFrom !== null && index >= enterFrom;
          const caption = tile === 'md' && !more ? photo.caption : null;
          return (
            <li
              key={photo.key}
              className={cn(featured && 'md:col-span-2 md:row-span-2', entering && 'animate-enter')}
              style={
                entering
                  ? {
                      animationDelay: `calc(var(--stagger) * ${Math.min(index - enterFrom, MAX_STAGGER_STEPS)})`,
                    }
                  : undefined
              }
            >
              <button
                type="button"
                onClick={() => setOpen(index)}
                className="group relative block aspect-square w-full cursor-pointer overflow-hidden rounded-control bg-(--color-surface-raised) focus-visible:outline-offset-2"
              >
                <Image
                  src={photo.image.url}
                  alt={photo.image.alt}
                  fill
                  sizes={featured ? TILE_SIZES.feature : TILE_SIZES[tile]}
                  // The first tile of a grid that opens the page is its largest
                  // paint: fetch it first. The rest of the first row loads at once.
                  {...(index === 0 && eager > 0
                    ? { preload: true }
                    : { loading: index < eager ? 'eager' : 'lazy' })}
                  className="object-cover transition-transform duration-(--dur-long) ease-out-expo group-hover:scale-105 group-focus-visible:scale-105"
                />
                {caption ? (
                  // Decorative: the button is named by the photo's alt text.
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 flex items-end bg-linear-to-t from-(--color-void)/80 via-(--color-void)/10 to-transparent p-4 opacity-0 transition-opacity duration-(--dur-short) ease-out-expo group-hover:opacity-100 group-focus-visible:opacity-100"
                  >
                    <span className="flex w-full translate-y-2 items-end justify-between gap-3 transition-transform duration-(--dur-medium) ease-out-expo group-hover:translate-y-0 group-focus-visible:translate-y-0">
                      <span className="line-clamp-2 text-start text-body-sm text-(--color-text)">
                        {caption}
                      </span>
                      <Icon icon={Expand} size="sm" className="shrink-0 text-(--color-text)" />
                    </span>
                  </span>
                ) : null}
                <span
                  aria-hidden="true"
                  data-curtain
                  // Inline, not `scale-y-0`: the utility sets the separate `scale`
                  // property, which would multiply with the scripted transform.
                  style={{ transform: 'scaleY(0)' }}
                  className="pointer-events-none absolute inset-0 origin-top bg-(--color-surface-raised) after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-(image:--gradient-rim)"
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
            // A new photo is a new element, so it fades in rather than popping.
            key={photo.key}
            src={photo.image.url}
            alt={photo.image.alt}
            width={photo.image.width}
            height={photo.image.height}
            sizes="(min-width: 64rem) 60rem, 100vw"
            // The photo someone just opened: never wait for it to be "near".
            loading="eager"
            className="max-h-[70dvh] w-auto animate-fade-in rounded-control object-contain"
          />
        </div>
        {many ? (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => step(-1)}
              className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-(--color-border-strong) text-(--color-text) transition-transform duration-(--dur-micro) ease-out-expo active:scale-95"
            >
              <Icon icon={ChevronLeft} size="md" label="Previous photo" />
            </button>
            <p className="line-clamp-2 text-center text-body-sm text-(--color-muted)">
              {photo.image.alt}
            </p>
            <button
              type="button"
              onClick={() => step(1)}
              className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-(--color-border-strong) text-(--color-text) transition-transform duration-(--dur-micro) ease-out-expo active:scale-95"
            >
              <Icon icon={ChevronRight} size="md" label="Next photo" />
            </button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
