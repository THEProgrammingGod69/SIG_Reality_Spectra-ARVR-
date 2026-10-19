'use client';

import { ChevronLeft, ChevronRight, Expand, Play } from 'lucide-react';
import Image from 'next/image';
import {
  type CSSProperties,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { prefersReducedMotion } from '@/components/motion/use-reduced-motion';
import { Icon } from '@/components/ui/icon';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/cn';
import { coverSizes } from '@/lib/image-sizes';
import { gsap, gsapEase, ScrollTrigger } from '@/lib/motion/gsap';
import { reachablePoint } from '@/lib/motion/scroll-point';
import { readMotionTokens } from '@/lib/motion/tokens';
import type { Image as StoredImage } from '@/lib/schemas/image';

export type GridPhoto = {
  key: string;
  /** The photo, or a clip's poster frame: what the tile shows. */
  image: StoredImage;
  /** Shown under the photo in the viewer, e.g. its caption or event. */
  caption?: string | null;
  /** A clip: the tile shows its poster, the viewer plays it (never on its own). */
  video?: { src: string; duration: number } | null;
  /** The event or series it belongs to, shown in the viewer. */
  album?: string | null;
  /** The photographer, shown in the viewer, e.g. "Photo: …". */
  credit?: string | null;
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
   * Tiles from this index on rise into place, `--stagger` apart (D-037): the
   * old count after "Show more". `null` (the default, and the first load)
   * shows every tile at once.
   */
  enterFrom?: number | null;
  /**
   * Develop the tiles below the fold from under a curtain as the reader
   * reaches them (`developOnScroll`). Turning it off uncovers every tile: the
   * gallery does once a filter has rearranged the grid.
   */
  develop?: boolean;
  /**
   * Tiles that just left the grid, kept in the list (hidden, inert) so a
   * filter animation can fade them out where they stood (`GalleryBrowser`).
   */
  leaving?: readonly GridPhoto[];
  /** The `<ul>`, for a parent that animates the tiles' layout (GSAP Flip). */
  listRef?: RefObject<HTMLUListElement | null>;
  className?: string;
};

const tiles = {
  sm: 'grid-cols-[repeat(auto-fill,minmax(min(100%,5.5rem),1fr))]',
  // Two columns on phones (8.5rem fits two from a 320px screen), so a long
  // gallery is half the scroll and each tile half the download; 14rem from sm.
  md: 'grid-cols-[repeat(auto-fill,minmax(min(100%,8.5rem),1fr))] sm:grid-cols-[repeat(auto-fill,minmax(min(100%,14rem),1fr))]',
} as const;

/**
 * How wide each tile renders, so the browser fetches the right image: `md`
 * tiles are at most half the screen below 64rem and about 18rem on a
 * full-width desktop row; a featured tile is two of them from md. Tiles crop
 * a square from the photo, so each tile widens these by its photo's shape
 * (`coverSizes`).
 */
const TILE_SIZES = {
  sm: '8rem',
  md: '(min-width: 64rem) 18rem, 50vw',
  feature: '(min-width: 64rem) 36rem, (min-width: 48rem) 66vw, 50vw',
} as const;

/** Entrances past this many tiles share the last delay, so a long batch never drags. */
export const MAX_STAGGER_STEPS = 12;

/** A tile's curtain lifts when the tile's top is this far down the viewport. */
const DEVELOP_AT = 0.92;
/** How much closer the photo starts while its curtain is down. */
const DEVELOP_ZOOM = 1.15;

/** 7.4 → "0:07": a clip's length the way video players write it. */
export function clipLength(seconds: number): string {
  const total = Math.max(1, Math.round(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Whether hovering a clip's tile may preview it: a real mouse (a touch "hover"
 * is a tap that opens the viewer), and never under reduced motion (rule 4).
 */
function canPreview(pointerType: string): boolean {
  return (
    pointerType === 'mouse' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !prefersReducedMotion()
  );
}

/**
 * Develops the tiles below the fold as the reader reaches them (D-038): each
 * tile waits under a curtain of the lab's surface with a line of spectrum
 * light on its lower edge, and the curtain lifts (`scaleY`) while the photo
 * settles back from slightly closer (`scale`) — row by row, a stagger apart.
 *
 * Tiles already on screen at load are never covered, so the first row (and
 * the page's largest paint) shows at once; nothing is covered without
 * JavaScript or under reduced motion, or for tiles that arrive with their own
 * entrance (after "Show more"). A clip's tile develops its poster, the first
 * `img` in the tile. Returns the cleanup.
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
 *
 * A clip is a tile like any photo — its poster, with a play badge — and plays
 * only in the viewer, with the browser's own controls; a mouse hovering its
 * tile previews it, muted (`ClipPreview`).
 */
export function PhotoGrid({
  photos,
  limit,
  eager = 0,
  tile = 'md',
  feature = false,
  enterFrom = null,
  develop = true,
  leaving = [],
  listRef: outerRef,
  className,
}: PhotoGridProps) {
  const [open, setOpen] = useState<number | null>(null);
  const ownRef = useRef<HTMLUListElement>(null);
  const listRef = outerRef ?? ownRef;
  const shown = limit === undefined ? photos : photos.slice(0, limit);
  const hidden = photos.length - shown.length;
  const staying = new Set(shown.map((photo) => photo.key));
  const gone = leaving.filter((photo) => !staying.has(photo.key));

  // The curtains are set once, for the tiles there at mount (see developOnScroll).
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!develop || !list || prefersReducedMotion()) return;
    return developOnScroll(list);
  }, [develop, listRef]);

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
        {/* One keyed list, shown and leaving tiles together: a tile that leaves
            stays the same element (React keys are per list), so the parent's
            animation finds it; hidden and inert, it is gone for everyone else. */}
        {[...shown, ...gone].map((photo, index) => {
          if (index >= shown.length) {
            return (
              <Tile
                key={photo.key}
                photo={photo}
                tile={tile}
                featured={false}
                more={0}
                loading="lazy"
                leaving
              />
            );
          }
          const more = hidden > 0 && index === shown.length - 1;
          const entering = enterFrom !== null && index >= enterFrom;
          return (
            <Tile
              key={photo.key}
              photo={photo}
              tile={tile}
              featured={feature && index === 0}
              more={more ? hidden + 1 : 0}
              loading={index === 0 && eager > 0 ? 'preload' : index < eager ? 'eager' : 'lazy'}
              className={entering ? 'animate-enter' : undefined}
              style={
                entering
                  ? {
                      animationDelay: `calc(var(--stagger) * ${Math.min(index - enterFrom, MAX_STAGGER_STEPS)})`,
                    }
                  : undefined
              }
              onOpen={() => setOpen(index)}
            />
          );
        })}
      </ul>
      {open !== null ? (
        <PhotoViewer photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
      ) : null}
    </>
  );
}

function Tile({
  photo,
  tile,
  featured,
  more,
  loading,
  leaving = false,
  className,
  style,
  onOpen,
}: {
  photo: GridPhoto;
  tile: 'sm' | 'md';
  featured: boolean;
  /** On the last tile of a limited grid: how many photos it stands for ("+N"). */
  more: number;
  loading: 'preload' | 'eager' | 'lazy';
  leaving?: boolean;
  className?: string;
  style?: CSSProperties;
  onOpen?: () => void;
}) {
  const [preview, setPreview] = useState(false);
  const caption = tile === 'md' && !more ? photo.caption : null;
  const video = photo.video ?? null;

  return (
    <li
      className={cn(
        featured && 'md:col-span-2 md:row-span-2',
        // Flip shows a leaving tile where it stood while it fades (`hidden`
        // is a class, not the attribute, which Tailwind makes `!important`).
        leaving && 'pointer-events-none hidden',
        className,
      )}
      style={style}
      inert={leaving}
    >
      <button
        type="button"
        onClick={onOpen}
        onPointerEnter={(event) => {
          if (video && canPreview(event.pointerType)) setPreview(true);
        }}
        onPointerLeave={() => setPreview(false)}
        className="group relative block aspect-square w-full cursor-pointer overflow-hidden rounded-control bg-(--color-surface-raised) focus-visible:outline-offset-2"
      >
        <Image
          src={photo.image.url}
          alt={photo.image.alt}
          fill
          sizes={coverSizes(featured ? TILE_SIZES.feature : TILE_SIZES[tile], photo.image)}
          // The first tile of a grid that opens the page is its largest
          // paint: fetch it first. The rest of the first row loads at once.
          {...(loading === 'preload' ? { preload: true } : { loading })}
          // `scale` only: the develop tween owns `transform` (see developOnScroll).
          className="object-cover transition-[scale] duration-(--dur-long) ease-out-expo group-hover:scale-105 group-focus-visible:scale-105"
        />
        {video ? (
          <>
            {preview ? <ClipPreview src={video.src} /> : null}
            {/* The button is named by the poster's alt; this says what opening it plays. */}
            <span className="sr-only"> (video, {clipLength(video.duration)})</span>
            {!more ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute end-2 top-2 inline-flex items-center gap-1 rounded-full bg-(--color-void)/70 px-2 py-1 font-mono text-label text-(--color-text)"
              >
                <Icon icon={Play} size="sm" />
                {tile === 'md' ? clipLength(video.duration) : null}
              </span>
            ) : null}
          </>
        ) : null}
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
            +{more}
            <span className="sr-only"> more photos</span>
          </span>
        ) : null}
      </button>
    </li>
  );
}

/**
 * A clip previewing under a mouse: muted, looping, decorative, mounted on
 * hover and removed on leave. It is the visitor's own gesture that starts it,
 * and it stops when they move away (WCAG 2.2.2); nothing plays otherwise. It
 * fades in (`opacity`) once it is really playing, so a slow load or a refused
 * play just leaves the poster.
 */
function ClipPreview({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    // A muted play() is allowed everywhere; if a browser still refuses, the poster stays.
    ref.current?.play().catch(() => {});
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      aria-hidden="true"
      muted
      loop
      playsInline
      preload="none"
      onPlaying={() => setPlaying(true)}
      className={cn(
        'pointer-events-none absolute inset-0 size-full object-cover transition-[opacity,scale] duration-(--dur-short) ease-out-expo group-hover:scale-105',
        playing ? 'opacity-100' : 'opacity-0',
      )}
    />
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
  const video = photo.video ?? null;
  const step = (by: number) => onIndex((index + by + photos.length) % photos.length);
  const many = photos.length > 1;
  const credits = [photo.album, photo.credit].filter((line): line is string => Boolean(line));

  // Arrow keys move through the photos wherever focus is inside the viewer —
  // except on the player, whose own controls seek with them.
  useEffect(() => {
    if (!many) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLVideoElement) return;
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
      title={`${video ? 'Video' : 'Photo'} ${index + 1} of ${photos.length}`}
      description={photo.caption ?? undefined}
      className="max-w-5xl"
    >
      <div className="flex flex-col gap-4">
        <div className="relative flex justify-center">
          {video ? (
            <video
              // A new item is a new element: the last clip stops, this one fades in.
              key={photo.key}
              src={video.src}
              poster={photo.image.url}
              width={photo.image.width}
              height={photo.image.height}
              aria-label={photo.image.alt}
              controls
              playsInline
              preload="metadata"
              className="max-h-[70dvh] w-auto animate-fade-in rounded-control bg-(--color-void)"
            />
          ) : (
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
          )}
        </div>
        {credits.length > 0 ? (
          <p className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-center font-mono text-label text-(--color-muted)">
            {credits.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
        ) : null}
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
