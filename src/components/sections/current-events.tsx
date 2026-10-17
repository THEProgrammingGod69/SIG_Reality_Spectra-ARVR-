import { CalendarDays, CalendarX2, ChevronDown, MapPin, Radio } from 'lucide-react';
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
import { HudCorners } from '@/components/ui/hud-corners';
import { Icon } from '@/components/ui/icon';
import { Section } from '@/components/ui/section';
import { cn } from '@/lib/cn';
import type { LiveSocial } from '@/lib/content';
import type { PublicEvents } from '@/lib/data';
import { formatDateTime } from '@/lib/dates';
import { categoryLabel } from '@/lib/schemas/category';
import { EVENT_MODES } from '@/lib/schemas/event';

import { Paragraphs } from './paragraphs';
import { SectionHeading } from './section-heading';
import { SocialButtons } from './social-buttons';

type PublicEvent = PublicEvents['current'][number];

/**
 * Section A: Ongoing Events — published events that have started and have not yet ended.
 * Each event card retains the full detailed presentation with a visible "Ongoing" status.
 */
export function OngoingEvents({ events }: { events: readonly PublicEvent[] }) {
  return (
    <Section labelledBy="ongoing-events">
      <SectionHeading id="ongoing-events" eyebrow="In progress" title="Ongoing events" />
      {events.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="No events in progress right now"
          description="Check back during scheduled event hours or browse our upcoming schedule below."
          className="mt-12"
        />
      ) : (
        <Stagger
          as="ul"
          className="mt-12 grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-6"
        >
          {events.map((event, index) => (
            <li key={event.id} className={cn(index === 0 && 'lg:col-span-full')}>
              <EventCard event={event} featured={index === 0} status="ongoing" />
            </li>
          ))}
        </Stagger>
      )}
    </Section>
  );
}

/**
 * Section B: Upcoming Events — published events whose start time is in the future.
 * Soonest start time first, retaining the featured leading card and full details.
 */
export function UpcomingEvents({
  events,
  socials,
}: {
  events: readonly PublicEvent[];
  socials: readonly LiveSocial[];
}) {
  return (
    <Section labelledBy="upcoming-events">
      <SectionHeading id="upcoming-events" eyebrow="Now and next" title="Upcoming events" />
      {events.length === 0 ? (
        <EmptyState
          icon={CalendarX2}
          title="No upcoming events right now"
          description="The next one will be announced here and on the club's channels."
          action={<SocialButtons socials={socials} />}
          className="mt-12"
        />
      ) : (
        <Stagger
          as="ul"
          className="mt-12 grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-6"
        >
          {events.map((event, index) => (
            <li key={event.id} className={cn(index === 0 && 'lg:col-span-full')}>
              <EventCard event={event} featured={index === 0} status="upcoming" />
            </li>
          ))}
        </Stagger>
      )}
    </Section>
  );
}

/**
 * Combined CurrentEvents component retained for backwards compatibility:
 * splits the request-time current events into Ongoing and Upcoming sections.
 */
export function CurrentEvents({
  events,
  socials,
  now,
}: {
  events: readonly PublicEvent[];
  socials: readonly LiveSocial[];
  now?: number;
}) {
  const ongoing = now !== undefined ? events.filter((e) => Date.parse(e.startsAt) <= now) : [];
  const upcoming = now !== undefined ? events.filter((e) => Date.parse(e.startsAt) > now) : events;

  return (
    <>
      <OngoingEvents events={ongoing} />
      <UpcomingEvents events={upcoming} socials={socials} />
    </>
  );
}

function EventCard({
  event,
  featured,
  status,
}: {
  event: PublicEvent;
  featured: boolean;
  status: 'ongoing' | 'upcoming';
}) {
  const mode = EVENT_MODES.find((entry) => entry.id === event.mode)?.label;
  return (
    <Card featured={featured} spotlight className={cn('group/event', featured && 'lg:flex-row')}>
      <CardMedia
        ratio="4/5"
        className={cn('bg-(--color-void)', featured && 'lg:w-[min(26rem,40%)]')}
      >
        {event.poster ? (
          <Image
            src={event.poster.url}
            alt={event.poster.alt}
            fill
            sizes={
              featured
                ? '(min-width: 64rem) 26rem, (min-width: 44rem) 50vw, 100vw'
                : '(min-width: 64rem) 24rem, (min-width: 44rem) 50vw, 100vw'
            }
            className="object-contain"
            preload={featured}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-(image:--gradient-spectra) opacity-20" />
        )}
        {/* The poster in the headset's sights (D-038): brackets lock on under the pointer. */}
        <HudCorners
          className="inset-3 scale-110 text-(--color-spectra-cyan) opacity-0 transition-[scale,opacity] duration-(--dur-medium) ease-out-expo group-focus-within/event:scale-100 group-focus-within/event:opacity-100 group-hover/event:scale-100 group-hover/event:opacity-100"
          cornerClassName="size-5"
        />
      </CardMedia>
      <CardBody className={cn(featured && 'lg:justify-center lg:gap-4 lg:p-10')}>
        <div className="flex flex-wrap items-center gap-2">
          {status === 'ongoing' ? (
            <Badge tone="success" className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-(--color-success) animate-pulse" />
              Ongoing
            </Badge>
          ) : (
            <Badge tone="neutral" className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-(--color-muted)" />
              Upcoming
            </Badge>
          )}
          <Badge tone="accent">{categoryLabel(event.category)}</Badge>
          {mode ? <Badge>{mode}</Badge> : null}
        </div>
        <CardTitle className={cn(featured && 'lg:text-display-md')}>{event.title}</CardTitle>
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
        <CardDescription className={cn(featured && 'lg:text-body')}>
          {event.summary}
        </CardDescription>
        {event.description ? (
          <details className="group/details text-body-sm text-(--color-text-body)">
            <summary className="inline-flex cursor-pointer select-none list-none items-center gap-2 rounded-full border border-(--color-accent)/40 bg-(--color-accent)/10 px-3.5 py-1.5 font-medium text-body-sm text-(--color-accent) transition-all duration-(--dur-short) ease-out-expo hover:border-(--color-accent) hover:bg-(--color-accent)/20 hover:shadow-[0_0_12px_var(--color-accent)] focus-visible:outline-2 focus-visible:outline-(--color-accent) active:scale-95">
              <span>More about this event</span>
              <Icon
                icon={ChevronDown}
                size="sm"
                className="transition-transform duration-(--dur-short) ease-out-expo group-open/details:rotate-180"
              />
            </summary>
            <div className="mt-3.5 rounded-control border border-(--color-border) bg-(--color-surface-raised)/40 p-4">
              <Paragraphs text={event.description} />
            </div>
          </details>
        ) : null}
        <CardFooter className={cn(featured && 'lg:mt-4')}>
          {event.registrationUrl ? (
            <ButtonLink
              href={event.registrationUrl}
              external
              variant={featured ? 'star' : 'secondary'}
              size={featured ? 'lg' : 'md'}
              magnetic={featured}
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
