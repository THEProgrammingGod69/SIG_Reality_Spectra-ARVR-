'use client';

import { Images } from 'lucide-react';
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { prefersReducedMotion } from '@/components/motion/use-reduced-motion';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/cn';
import type { GalleryItem } from '@/lib/data';
import { Flip, gsap, gsapEase } from '@/lib/motion/gsap';
import { readMotionTokens } from '@/lib/motion/tokens';
import type { Category } from '@/lib/schemas/category';

import { type GridPhoto, MAX_STAGGER_STEPS, PhotoGrid } from './photo-grid';

/** Photos per "page"; "Show more" reveals the next batch. */
// 30 fills whole rows at 1, 2, 3, 5 and 6 columns: phones, tablets and wide
// desktops never end a batch on a half-empty row.
const BATCH = 30;
// The first batch is three short, because from `md` the lead photo is a
// double tile taking four cells: 27 photos fill the same 30 cells, so the 3-,
// 5- and 6-column grids still end on whole rows (D-037).
const FIRST_BATCH = BATCH - 3;

/** How small a tile is as it fades in or out during a filter change. */
const FILTER_SCALE = 0.9;

/**
 * The items under a filter, newest first, led by the newest photo: the lead
 * is the double tile, and a clip's poster is a small still that would blur at
 * that size, so a newer clip gives the lead to the photo after it.
 */
function arrange(items: readonly GalleryItem[], category: Category | null): GalleryItem[] {
  const visible =
    category === null ? [...items] : items.filter((item) => item.category === category);
  const lead = visible.findIndex((item) => item.video === null);
  if (lead > 0) visible.unshift(...visible.splice(lead, 1));
  return visible;
}

function toGridPhoto(item: GalleryItem): GridPhoto {
  return {
    key: item.key,
    image: item.image,
    caption: item.source.kind === 'event' ? item.source.eventTitle : item.caption,
    video: item.video,
    album: item.album,
    credit: item.credit,
  };
}

/**
 * /gallery: every photo and clip, newest first, filterable by the shared
 * categories. Filters list only categories that have items; counts show what
 * each holds.
 *
 * The newest photo leads as a double-size tile (D-037). Choosing a filter
 * rearranges the grid in place (GSAP Flip, `transform` only): tiles that stay
 * glide to their new cells, new ones fade and grow in, leaving ones fade out
 * where they stood, a `--stagger` apart. "Show more" brings its batch in one
 * after another. The first load shows every tile at once, so the page's
 * largest paint is never held back; under reduced motion nothing moves.
 */
export function GalleryBrowser({
  items,
  categories,
}: {
  items: readonly GalleryItem[];
  /**
   * The shared categories, in order (`CATEGORIES`). Passed by the page rather
   * than imported, so this client component never pulls the schema module —
   * and zod with it — into the browser (D-033).
   */
  categories: readonly { id: Category; label: string }[];
}) {
  const [category, setCategory] = useState<Category | null>(null);
  const [shown, setShown] = useState(FIRST_BATCH);
  const [enterFrom, setEnterFrom] = useState<number | null>(null);
  const [filtered, setFiltered] = useState(false);
  const [leaving, setLeaving] = useState<readonly GridPhoto[]>([]);
  const listRef = useRef<HTMLUListElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const flipping = useRef<gsap.core.Timeline | null>(null);

  // A filter change still moving when the gallery unmounts stops with it.
  useEffect(() => () => void flipping.current?.kill(), []);

  // After a filter change has rendered: animate from the layout captured
  // before it (`choose`) to the new one.
  useLayoutEffect(() => {
    const state = flipState.current;
    const list = listRef.current;
    flipState.current = null;
    if (!state || !list) return;

    const tokens = readMotionTokens();
    const delay = (index: number) => tokens.stagger * Math.min(index, MAX_STAGGER_STEPS);
    const faces = (tiles: Element[]) => tiles.map((tile) => tile.firstElementChild);
    // Tiles are absolutely placed while they move; hold the grid's new height
    // so the page below does not jump (a static size, never animated).
    gsap.set(list, { height: list.offsetHeight });

    flipping.current = Flip.from(state, {
      targets: Array.from(list.children),
      scale: true,
      absolute: true,
      duration: tokens.dur.medium,
      ease: gsapEase(tokens, 'inOut'),
      stagger: delay,
      // The faces fade, not the tiles: a tile's opacity belongs to `focus-dim`.
      onEnter: (tiles) =>
        gsap.fromTo(
          faces(tiles),
          { opacity: 0, scale: FILTER_SCALE },
          {
            opacity: 1,
            scale: 1,
            duration: tokens.dur.medium,
            ease: gsapEase(tokens, 'outExpo'),
            stagger: delay,
            clearProps: 'opacity,transform',
          },
        ),
      onLeave: (tiles) =>
        gsap.to(faces(tiles), {
          opacity: 0,
          scale: FILTER_SCALE,
          duration: tokens.dur.short,
          ease: gsapEase(tokens, 'inOut'),
        }),
      onComplete: () => {
        gsap.set(list, { clearProps: 'height' });
        setLeaving([]);
      },
    });
    // No cleanup here: the next filter change finishes this one itself, when
    // `Flip.getState` captures the tiles mid-move.
  }, [category]);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Images}
        title="No photos yet"
        description="Photos from the club's events and labs appear here."
      />
    );
  }

  const counts = new Map<Category, number>();
  for (const item of items) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  const filters = categories.filter((entry) => counts.has(entry.id));
  const visible = arrange(items, category);
  const photos = visible.slice(0, shown).map(toGridPhoto);

  const choose = (next: Category | null) => {
    if (next === category) return;
    const list = listRef.current;
    if (list && !prefersReducedMotion()) {
      // Capture where every tile is now (finishing any filter still moving),
      // and keep the tiles that are about to go, for their exit.
      flipState.current = Flip.getState(Array.from(list.children));
      const staying = new Set(
        arrange(items, next)
          .slice(0, FIRST_BATCH)
          .map((item) => item.key),
      );
      setLeaving(photos.filter((photo) => !staying.has(photo.key)));
    } else {
      setLeaving([]);
    }
    setCategory(next);
    setShown(FIRST_BATCH);
    setEnterFrom(null);
    setFiltered(true);
  };

  return (
    <div className="flex flex-col gap-8">
      <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
        <FilterButton active={category === null} onClick={() => choose(null)}>
          All <span className="text-(--color-muted)">{items.length}</span>
        </FilterButton>
        {filters.map((entry) => (
          <FilterButton
            key={entry.id}
            active={category === entry.id}
            onClick={() => choose(entry.id)}
          >
            {entry.label} <span className="text-(--color-muted)">{counts.get(entry.id)}</span>
          </FilterButton>
        ))}
      </div>

      <PhotoGrid
        listRef={listRef}
        eager={4}
        feature
        enterFrom={enterFrom}
        // Once a filter has rearranged the grid, every tile is uncovered.
        develop={!filtered}
        leaving={leaving}
        photos={photos}
      />

      {visible.length > shown ? (
        <Button
          variant="secondary"
          className="self-center"
          onClick={() => {
            setEnterFrom(shown);
            setShown((current) => current + BATCH);
          }}
        >
          Show more ({visible.length - shown} left)
        </Button>
      ) : null}
    </div>
  );
}

/**
 * A category filter. The active one is outlined in the accent with a lit dot
 * that scales in (`transform`); colours change instantly (D-022).
 */
function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'group/filter inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border px-4 text-body-sm transition-transform duration-(--dur-micro) ease-out-expo active:scale-[0.97]',
        active
          ? 'border-(--color-accent) bg-(--color-surface-raised) text-(--color-text)'
          : 'border-(--color-border-strong) text-(--color-text-body) hover:text-(--color-text)',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-1.5 rounded-full bg-(--color-accent) shadow-glow transition-[scale,opacity] duration-(--dur-short) ease-out-expo',
          // Space is kept when unlit, so choosing a filter never shifts the row.
          active ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
        )}
      />
      {children}
    </button>
  );
}
