'use client';

import { Images } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/cn';
import type { GalleryItem } from '@/lib/data';
import type { Category } from '@/lib/schemas/category';

import { PhotoGrid } from './photo-grid';

/** Photos per "page"; "Show more" reveals the next batch. */
// 30 fills whole rows at 1, 2, 3, 5 and 6 columns: phones, tablets and wide
// desktops never end a batch on a half-empty row.
const BATCH = 30;

/**
 * /gallery: every photo, newest first, filterable by the shared categories.
 * Filters list only categories that have photos; counts show what each holds.
 *
 * The newest photo leads as a double-size tile (D-037). A filter change brings
 * its photos in one after another, and "Show more" does the same for the new
 * batch only; the first load shows every tile at once, so the page's largest
 * paint is never held back.
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
  const [shown, setShown] = useState(BATCH);
  const [enterFrom, setEnterFrom] = useState<number | null>(null);

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
  const visible = category === null ? items : items.filter((item) => item.category === category);

  const choose = (next: Category | null) => {
    if (next === category) return;
    setCategory(next);
    setShown(BATCH);
    setEnterFrom(0);
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
        // A new filter is a new set of tiles: remount, so each one enters.
        key={category ?? 'all'}
        eager={4}
        feature
        enterFrom={enterFrom}
        photos={visible.slice(0, shown).map((item) => ({
          key: item.key,
          image: item.image,
          caption: item.source.kind === 'event' ? item.source.eventTitle : item.caption,
        }))}
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
