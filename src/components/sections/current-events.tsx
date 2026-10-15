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
import { HudCorners } from '@/components/ui/hud-corners';
import { Icon } from '@/components/ui/icon';
import { Section } from '@/components/ui/section';
import type { LiveSocial } from '@/lib/content';
import type { PublicEvents } from '@/lib/data';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/dates';
import { categoryLabel } from '@/lib/schemas/category';
import { EVENT_MODES } from '@/lib/schemas/event';

import { Paragraphs } from './paragraphs';
import { SectionHeading } from './section-heading';
import { SocialButtons } from './social-buttons';

type PublicEvent = PublicEvents['current'][number];

/**
 * /events, top: what is on now or next, soonest first, each with its
 * registration link. Posters of any shape sit whole in a 4:5 frame (D-031).
 *
 * The soonest event leads (D-037): from `lg` it spans the row as a wide card,
 * poster beside its details, lit by the spotlight and the star-bordered
 * Register button; the rest follow in the grid. With one event, that one
 * card fills the row instead of standing alone in a third of it.
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
      <SectionHeading id="current-events" eyebrow="Now and next" title="Happening next" />
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
            // 20rem-minimum cards: two columns only once two fit beside each
            // other; the leading card's poster is at most 26rem wide from lg.
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
        <div className="flex flex-wrap gap-2">
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
          <details className="text-body-sm text-(--color-text-body)">
            <summary className="cursor-pointer text-(--color-muted) hover:text-(--color-text)">
              More about this event
            </summary>
            <Paragraphs text={event.description} className="mt-3" />
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
