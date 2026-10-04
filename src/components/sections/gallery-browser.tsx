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
const BATCH = 24;

/**
 * /gallery: every photo, newest first, filterable by the shared categories.
 * Filters list only categories that have photos; counts show what each holds.
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
    setCategory(next);
    setShown(BATCH);
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
        eager={4}
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
          onClick={() => setShown((current) => current + BATCH)}
        >
          Show more ({visible.length - shown} left)
        </Button>
      ) : null}
    </div>
  );
}

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
        'inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border px-4 text-body-sm',
        active
          ? 'border-(--color-accent) text-(--color-text)'
          : 'border-(--color-border-strong) text-(--color-text-body) hover:text-(--color-text)',
      )}
    >
      {children}
    </button>
  );
}
