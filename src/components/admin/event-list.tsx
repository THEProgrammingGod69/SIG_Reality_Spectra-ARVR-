import { CalendarDays } from 'lucide-react';
import Image from 'next/image';
import type { ReactNode } from 'react';

import { Icon } from '@/components/ui/icon';
import { formatDateTime } from '@/lib/dates';
import { categoryLabel } from '@/lib/schemas/category';
import type { Event, EventPhase } from '@/lib/schemas/event';

import { EventPhaseBadge } from './event-phase-badge';
import { GuardedLink } from './unsaved-changes';

/** One event in an admin list (dashboard, events tool), linking to its editor. */
export function EventRow({ event, phase }: { event: Event; phase: EventPhase }) {
  return (
    <GuardedLink
      href={`/admin/events/${event.id}`}
      className="flex min-w-0 flex-1 items-center gap-4 rounded-control p-2 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className="relative flex aspect-4/5 w-10 shrink-0 items-center justify-center overflow-hidden rounded-control bg-secondary text-muted-foreground">
        {event.poster ? (
          <Image src={event.poster.url} alt="" fill sizes="2.5rem" className="object-cover" />
        ) : (
          <Icon icon={CalendarDays} size="sm" />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="line-clamp-1 text-body-sm font-medium wrap-anywhere text-foreground">
          {event.title}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDateTime(event.startsAt)} · {categoryLabel(event.category)}
          {event.photos.length > 0
            ? ` · ${event.photos.length} photo${event.photos.length === 1 ? '' : 's'}`
            : ''}
        </span>
      </span>
      <EventPhaseBadge phase={phase} />
    </GuardedLink>
  );
}

export type PhasedEvent = { event: Event; phase: EventPhase };

/**
 * A list of events with an empty message, optionally cut to the first few,
 * and an optional quick action beside each (e.g. "Put on timeline").
 */
export function EventList({
  items,
  empty,
  limit,
  action,
}: {
  items: readonly PhasedEvent[];
  empty: string;
  limit?: number;
  action?: (item: PhasedEvent) => ReactNode;
}) {
  if (items.length === 0) {
    return <p className="text-body-sm text-muted-foreground">{empty}</p>;
  }
  const shown = limit === undefined ? items : items.slice(0, limit);
  return (
    <>
      <ul className="flex flex-col gap-1">
        {shown.map((item) => (
          <li key={item.event.id} className="flex flex-wrap items-center gap-2">
            <EventRow event={item.event} phase={item.phase} />
            {action?.(item)}
          </li>
        ))}
      </ul>
      {items.length > shown.length ? (
        <p className="text-xs text-muted-foreground">and {items.length - shown.length} more</p>
      ) : null}
    </>
  );
}
