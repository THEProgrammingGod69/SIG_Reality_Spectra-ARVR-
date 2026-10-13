import Image from 'next/image';
import { History } from 'lucide-react';

import { publicRead, getPublicEvents, type PublicEvents } from '@/lib/data';
import { categoryLabel } from '@/lib/schemas/category';
import { formatDate } from '@/lib/dates';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardBody, CardDescription, CardMedia, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Eyebrow } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';

type TimelineEvent = PublicEvents['timeline'][number];

export async function EventsPreview() {
  const read = await publicRead('the Home events preview', getPublicEvents);

  if ('failed' in read) {
    return <Section><EmptyState icon={History} title="Events are loading" description="Please visit the events page for the latest updates." /></Section>;
  }

  return <EventsPreviewContent events={read.data.timeline.slice(0, 3)} />;
}

export function EventsPreviewFallback() {
  return (
    <Section aria-busy="true" className="pt-0">
      <div className="h-8 w-56 animate-pulse rounded-control bg-(--color-surface-raised)" />
      <div className="mt-8 h-24 rounded-card bg-(--color-surface-raised) opacity-60" />
    </Section>
  );
}

function EventsPreviewContent({ events }: { events: readonly TimelineEvent[] }) {
  return (
    <Section labelledBy="events-preview" className="pt-0">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow>From the timeline</Eyebrow>
          <Heading level={2} id="events-preview" className="mt-3 text-display-lg">
            Events we&apos;ve conducted
          </Heading>
        </div>
        <ButtonLink href="/events" variant="secondary">View all events</ButtonLink>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={History}
          title="The timeline starts with the next event"
          description="Past event recaps and photos will appear here after they are published."
          className="mt-8"
        />
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {events.map((event) => <TimelinePreviewCard key={event.id} event={event} />)}
        </div>
      )}
    </Section>
  );
}

function TimelinePreviewCard({ event }: { event: TimelineEvent }) {
  const image = event.photos[0];
  return (
    <Card>
      <CardMedia ratio="4/5">
        {image ? (
          <Image src={image.url} alt={image.alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
        ) : (
          <div className="h-full bg-(image:--gradient-spectra) opacity-30" />
        )}
      </CardMedia>
      <CardBody>
        <div className="flex flex-wrap gap-2">
          <Badge tone="accent">{categoryLabel(event.category)}</Badge>
          <Eyebrow as="span"><time dateTime={event.startsAt}>{formatDate(event.startsAt)}</time></Eyebrow>
        </div>
        <CardTitle>{event.title}</CardTitle>
        <CardDescription>{event.recap ?? event.summary}</CardDescription>
      </CardBody>
    </Card>
  );
}
