import { History } from 'lucide-react';

import { Reveal } from '@/components/motion/reveal';
import { SplitText } from '@/components/motion/split-text';
import { TimelineMarker, TimelineRail } from '@/components/motion/timeline-rail';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Eyebrow, Text } from '@/components/ui/text';
import type { PublicEvents } from '@/lib/data';
import { formatDate } from '@/lib/dates';
import { categoryLabel } from '@/lib/schemas/category';

import { Paragraphs } from './paragraphs';
import { PhotoGrid } from './photo-grid';
import { EyebrowDash } from './section-heading';

type TimelineEvent = PublicEvents['timeline'][number];

/** Photos shown per event before "+N"; all of them open in the viewer. */
const PHOTOS_PER_EVENT = 6;

/**
 * /events, below: every past event the club has put on the timeline, most
 * recent first, with its recap and photos. Built in-house (D-004).
 *
 * The rail fills with spectrum light as the reader moves down it, and each
 * event's marker lights as it is reached (`TimelineRail`, D-037). Without
 * JavaScript or under reduced motion the rail is the plain hairline and every
 * marker is lit.
 */
export function EventTimeline({ events }: { events: readonly TimelineEvent[] }) {
  return (
    <Section labelledBy="event-timeline">
      {/* Heading and list share one parent (not SectionHeading's wrapper):
          the entries are found from the heading's container. */}
      <EyebrowDash>Past events</EyebrowDash>
      <Heading level={2} id="event-timeline" className="mt-4">
        <SplitText text="Timeline" />
      </Heading>
      {events.length > 0 ? (
        <Text tone="muted" className="mt-4 max-w-prose">
          What the club has built, taught and competed in, most recent first.
        </Text>
      ) : null}
      {events.length === 0 ? (
        <EmptyState
          icon={History}
          title="The timeline starts with the next event"
          description="After each event, its recap and photos appear here."
          className="mt-12"
        />
      ) : (
        <div className="relative mt-12">
          <TimelineRail />
          <ol className="flex flex-col gap-16 ps-6 md:ps-12">
            {events.map((event) => (
              <li key={event.id} className="relative">
                {/* The marker on the rail, centred on it: the list's indent plus half its size. */}
                <TimelineMarker className="-start-[calc(1.5rem+0.3125rem)] md:-start-[calc(3rem+0.3125rem)]" />
                <Reveal className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Eyebrow as="span" className="text-(--color-text-body)">
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
                    <p className="max-w-prose text-body text-(--color-text-body)">
                      {event.summary}
                    </p>
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
        </div>
      )}
    </Section>
  );
}
