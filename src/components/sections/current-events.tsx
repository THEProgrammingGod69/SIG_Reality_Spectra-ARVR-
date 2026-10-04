import { CalendarDays, CalendarX2, MapPin } from 'lucide-react';
import Image from 'next/image';

import { Stagger } from '@/components/motion/stagger';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import {
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardMedia,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { Section } from '@/components/ui/section';
import type { LiveSocial } from '@/lib/content';
import type { PublicEvents } from '@/lib/data';
import { formatDateTime } from '@/lib/dates';
import { categoryLabel } from '@/lib/schemas/category';
import { EVENT_MODES } from '@/lib/schemas/event';

import { Paragraphs } from './paragraphs';
import { SocialButtons } from './social-buttons';

type PublicEvent = PublicEvents['current'][number];

/**
 * /events, top: what is on now or next, soonest first, each with its
 * registration link. Posters of any shape sit whole in a 4:5 frame (D-031).
 */
export function CurrentEvents({
  events,
  socials,
}: {
  events: readonly PublicEvent[];
  socials: readonly LiveSocial[];
}) {
  return (
    <Section labelledBy="current-events">
      <Heading level={2} id="current-events">
        Happening next
      </Heading>
      {events.length === 0 ? (
        <EmptyState
          icon={CalendarX2}
          title="No upcoming events right now"
          description="The next one will be announced here and on the club's channels."
          action={<SocialButtons socials={socials} />}
          className="mt-10"
        />
      ) : (
        <Stagger
          as="ul"
          className="mt-10 grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-6"
        >
          {events.map((event, index) => (
            <li key={event.id}>
              <EventCard event={event} featured={index === 0} />
            </li>
          ))}
        </Stagger>
      )}
    </Section>
  );
}

function EventCard({ event, featured }: { event: PublicEvent; featured: boolean }) {
  const mode = EVENT_MODES.find((entry) => entry.id === event.mode)?.label;
  return (
    <Card featured={featured}>
      <CardMedia ratio="4/5" className="bg-(--color-void)">
        {event.poster ? (
          <Image
            src={event.poster.url}
            alt={event.poster.alt}
            fill
            // 20rem-minimum cards: two columns only once two fit beside each other.
            sizes="(min-width: 64rem) 24rem, (min-width: 44rem) 50vw, 100vw"
            className="object-contain"
            preload={featured}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-(image:--gradient-spectra) opacity-20" />
        )}
      </CardMedia>
      <CardBody>
        <div className="flex flex-wrap gap-2">
          <Badge tone="accent">{categoryLabel(event.category)}</Badge>
          {mode ? <Badge>{mode}</Badge> : null}
        </div>
        <CardTitle>{event.title}</CardTitle>
        <ul className="flex flex-col gap-1 text-body-sm text-(--color-text-body)">
          <li className="flex gap-2">
            <Icon icon={CalendarDays} size="sm" className="mt-0.5 text-(--color-muted)" />
            <span>
              {formatDateTime(event.startsAt)}
              {event.endsAt ? ` – ${formatDateTime(event.endsAt)}` : ''}
            </span>
          </li>
          <li className="flex gap-2">
            <Icon icon={MapPin} size="sm" className="mt-0.5 text-(--color-muted)" />
            <span className="wrap-anywhere">{event.venue}</span>
          </li>
        </ul>
        <CardDescription>{event.summary}</CardDescription>
        {event.description ? (
          <details className="text-body-sm text-(--color-text-body)">
            <summary className="cursor-pointer text-(--color-muted) hover:text-(--color-text)">
              More about this event
            </summary>
            <Paragraphs text={event.description} className="mt-3" />
          </details>
        ) : null}
        <CardFooter>
          {event.registrationUrl ? (
            <ButtonLink
              href={event.registrationUrl}
              external
              variant={featured ? 'star' : 'primary'}
              aria-label={`Register for ${event.title}`}
            >
              Register
            </ButtonLink>
          ) : null}
        </CardFooter>
      </CardBody>
    </Card>
  );
}
