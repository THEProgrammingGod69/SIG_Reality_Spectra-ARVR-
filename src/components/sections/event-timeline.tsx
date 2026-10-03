import { History } from 'lucide-react';

import { Reveal } from '@/components/motion/reveal';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Eyebrow } from '@/components/ui/text';
import type { PublicEvents } from '@/lib/data';
import { formatDate } from '@/lib/dates';
import { categoryLabel } from '@/lib/schemas/category';

import { Paragraphs } from './paragraphs';
import { PhotoGrid } from './photo-grid';

type TimelineEvent = PublicEvents['timeline'][number];

/** Photos shown per event before "+N"; all of them open in the viewer. */
const PHOTOS_PER_EVENT = 6;

/**
 * /events, below: every past event the club has put on the timeline, most
 * recent first, with its recap and photos. Built in-house (D-004).
 */
export function EventTimeline({ events }: { events: readonly TimelineEvent[] }) {
  return (
    <Section labelledBy="event-timeline">
      <Heading level={2} id="event-timeline">
        Timeline
      </Heading>
      {events.length === 0 ? (
        <EmptyState
          icon={History}
          title="The timeline starts with the next event"
          description="After each event, its recap and photos appear here."
          className="mt-10"
        />
      ) : (
        <ol className="relative mt-10 flex flex-col gap-12 border-s border-(--color-border) ps-6 md:ps-10">
          {events.map((event) => (
            <li key={event.id} className="relative">
              {/* The marker on the rail: a point of spectrum light. */}
              <span
                aria-hidden="true"
                className="absolute -start-[calc(1.5rem+0.3125rem)] top-1.5 size-2.5 rounded-full bg-(--color-accent) shadow-glow md:-start-[calc(2.5rem+0.3125rem)]"
              />
              <Reveal className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Eyebrow as="span">
                    <time dateTime={event.startsAt}>{formatDate(event.startsAt)}</time>
                  </Eyebrow>
                  <Badge tone="accent">{categoryLabel(event.category)}</Badge>
                </div>
                <Heading level={3} size="md" className="wrap-anywhere">
                  {event.title}
                </Heading>
                {event.recap ? (
                  <Paragraphs
                    text={event.recap}
                    className="max-w-prose text-body text-(--color-text-body)"
                  />
                ) : (
                  <p className="max-w-prose text-body text-(--color-text-body)">{event.summary}</p>
                )}
                <PhotoGrid
                  tile="sm"
                  limit={PHOTOS_PER_EVENT}
                  photos={event.photos.map((image) => ({
                    key: image.url,
                    image,
                    caption: event.title,
                  }))}
                  className="max-w-3xl"
                />
              </Reveal>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}
