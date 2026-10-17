'use client';

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  History,
  MapPin,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { DecodeText } from '@/components/motion/decode-text';
import { Reveal } from '@/components/motion/reveal';
import { SplitText } from '@/components/motion/split-text';
import { TimelineMarker, TimelineRail } from '@/components/motion/timeline-rail';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { Modal } from '@/components/ui/modal';
import { Section } from '@/components/ui/section';
import { Eyebrow, Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import type { PublicEvents } from '@/lib/data';
import { formatDate, formatDateTime } from '@/lib/dates';
import { categoryLabel } from '@/lib/schemas/category';
import { EVENT_MODES } from '@/lib/schemas/event';

import { Paragraphs } from './paragraphs';
import { EyebrowDash } from './section-heading';

type TimelineEvent = PublicEvents['timeline'][number];

/**
 * Section C: Compact vertical timeline of past events.
 *
 * Displays eligible timeline events in reverse chronological order along the connected
 * TimelineRail and TimelineMarker visual track. Each entry is a compact interactive card
 * displaying only the event's date, category, and title.
 *
 * Activating any timeline card opens an accessible modal with complete details and photo gallery.
 */
export function EventTimeline({ events }: { events: readonly TimelineEvent[] }) {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  return (
    <Section labelledBy="event-timeline">
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
          <ol className="flex flex-col gap-6 ps-6 md:ps-12">
            {events.map((event) => (
              <li key={event.id} className="relative">
                {/* Marker on the vertical rail */}
                <TimelineMarker className="-start-[calc(1.5rem+0.3125rem)] md:-start-[calc(3rem+0.3125rem)]" />
                <Reveal>
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(event)}
                    className="group/card block w-full cursor-pointer text-start focus-visible:outline-none"
                    aria-haspopup="dialog"
                    aria-label={`View details for ${event.title}`}
                  >
                    <Card
                      interactive
                      className="p-5 md:p-6 transition-transform duration-(--dur-short) ease-out-expo"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <Eyebrow as="span" className="text-(--color-text-body)">
                              <time dateTime={event.startsAt}>
                                <DecodeText text={formatDate(event.startsAt)} />
                              </time>
                            </Eyebrow>
                            <Badge tone="accent">{categoryLabel(event.category)}</Badge>
                          </div>
                          <span
                            aria-hidden="true"
                            className="inline-flex items-center gap-1.5 rounded-full border border-(--color-accent)/40 bg-(--color-accent)/10 px-3 py-1 font-mono text-label font-medium text-(--color-accent) shadow-[0_0_10px_rgba(0,255,224,0.12)] transition-all duration-(--dur-short) ease-out-expo group-hover/card:border-(--color-accent) group-hover/card:bg-(--color-accent)/20 group-hover/card:shadow-[0_0_16px_var(--color-accent)]"
                          >
                            <span>View details</span>
                            <Icon
                              icon={ChevronRight}
                              size="sm"
                              className="transition-transform duration-(--dur-short) ease-out-expo group-hover/card:translate-x-0.5"
                            />
                          </span>
                        </div>
                        <Heading
                          level={3}
                          size="md"
                          className="wrap-anywhere transition-colors duration-(--dur-short) group-hover/card:text-(--color-accent)"
                        >
                          {event.title}
                        </Heading>
                      </div>
                    </Card>
                  </button>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      )}

      {selectedEvent ? (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      ) : null}
    </Section>
  );
}

/**
 * Full details modal for a selected timeline event.
 * Displays all available fields including dates, venue, summary, description, recap,
 * poster, and an integrated photo gallery without creating nested dialogs.
 */
function EventDetailsModal({
  event,
  onClose,
}: {
  event: TimelineEvent;
  onClose: () => void;
}) {
  const [activePhoto, setActivePhoto] = useState(0);
  const mode = EVENT_MODES.find((entry) => entry.id === event.mode)?.label;
  const hasPhotos = event.photos && event.photos.length > 0;
  const currentPhoto = hasPhotos ? event.photos[activePhoto] : null;

  // Keyboard navigation for photo gallery within the modal
  useEffect(() => {
    if (!hasPhotos || event.photos.length <= 1) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setActivePhoto((prev) => (prev + 1) % event.photos.length);
      } else if (e.key === 'ArrowLeft') {
        setActivePhoto((prev) => (prev - 1 + event.photos.length) % event.photos.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasPhotos, event.photos.length]);

  return (
    <Modal
      open
      onClose={onClose}
      title={event.title}
      description={event.summary}
      className="max-w-3xl"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Category & mode badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">{categoryLabel(event.category)}</Badge>
          {mode ? <Badge>{mode}</Badge> : null}
        </div>

        {/* Date and venue details */}
        <ul className="flex flex-col gap-2.5 rounded-control border border-(--color-border) bg-(--color-surface-raised) p-4 text-body-sm text-(--color-text-body)">
          <li className="flex items-center gap-2">
            <Icon icon={CalendarDays} size="sm" className="shrink-0 text-(--color-muted)" />
            <span>
              {formatDateTime(event.startsAt)}
              {event.endsAt ? ` – ${formatDateTime(event.endsAt)}` : ''}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <Icon icon={MapPin} size="sm" className="shrink-0 text-(--color-muted)" />
            <span className="wrap-anywhere">{event.venue}</span>
          </li>
        </ul>

        {/* Poster image (if available) */}
        {event.poster ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-control border border-(--color-border) bg-(--color-void)">
            <Image
              src={event.poster.url}
              alt={event.poster.alt}
              fill
              sizes="(min-width: 48rem) 42rem, 100vw"
              className="object-contain"
            />
          </div>
        ) : null}

        {/* Detailed description (if available) */}
        {event.description ? (
          <div className="flex flex-col gap-2">
            <h3 className="font-display text-body font-semibold text-(--color-text)">
              About the Event
            </h3>
            <Paragraphs text={event.description} className="text-body-sm text-(--color-text-body)" />
          </div>
        ) : null}

        {/* Post-event recap (if available) */}
        {event.recap ? (
          <div className="flex flex-col gap-2">
            <h3 className="font-display text-body font-semibold text-(--color-text)">
              Event Recap
            </h3>
            <Paragraphs text={event.recap} className="text-body-sm text-(--color-text-body)" />
          </div>
        ) : null}

        {/* Photo Gallery (if photos are present) */}
        {hasPhotos && currentPhoto ? (
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-body font-semibold text-(--color-text)">
                Event Photos ({event.photos.length})
              </h3>
              {event.photos.length > 1 ? (
                <span className="font-mono text-label text-(--color-muted)">
                  {activePhoto + 1} of {event.photos.length}
                </span>
              ) : null}
            </div>

            {/* Active photo container with overlay controls */}
            <div className="relative flex flex-col gap-2 rounded-control border border-(--color-border) bg-(--color-void) p-2">
              <div className="group/gallery relative aspect-video max-h-[50dvh] w-full overflow-hidden rounded-control bg-(--color-surface)">
                <Image
                  key={currentPhoto.url}
                  src={currentPhoto.url}
                  alt={currentPhoto.alt}
                  fill
                  sizes="(min-width: 48rem) 42rem, 100vw"
                  className="object-contain animate-fade-in"
                />

                {/* Overlaid photo navigation for desktop & mobile */}
                {event.photos.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActivePhoto((prev) => (prev - 1 + event.photos.length) % event.photos.length)
                      }
                      className="absolute start-3 top-1/2 z-10 inline-flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-(--color-void)/75 text-white shadow-md backdrop-blur-md transition-all duration-(--dur-micro) ease-out-expo hover:scale-105 hover:border-(--color-accent) hover:bg-(--color-accent)/20 hover:text-(--color-accent) active:scale-95 focus-visible:outline-2 focus-visible:outline-(--color-accent)"
                      aria-label="Previous photo"
                    >
                      <Icon icon={ChevronLeft} size="sm" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActivePhoto((prev) => (prev + 1) % event.photos.length)
                      }
                      className="absolute end-3 top-1/2 z-10 inline-flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-(--color-void)/75 text-white shadow-md backdrop-blur-md transition-all duration-(--dur-micro) ease-out-expo hover:scale-105 hover:border-(--color-accent) hover:bg-(--color-accent)/20 hover:text-(--color-accent) active:scale-95 focus-visible:outline-2 focus-visible:outline-(--color-accent)"
                      aria-label="Next photo"
                    >
                      <Icon icon={ChevronRight} size="sm" />
                    </button>
                    <span className="absolute end-3 top-3 z-10 rounded-full border border-white/15 bg-(--color-void)/80 px-2.5 py-1 font-mono text-label text-white backdrop-blur-md">
                      {activePhoto + 1} / {event.photos.length}
                    </span>
                  </>
                ) : null}
              </div>

              {/* Photo caption */}
              {currentPhoto.alt ? (
                <p className="px-2 py-1 text-center font-mono text-label text-(--color-muted)">
                  {currentPhoto.alt}
                </p>
              ) : null}
            </div>

            {/* Thumbnails row if more than 1 photo */}
            {event.photos.length > 1 ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,4.5rem),1fr))] gap-2 pt-1">
                {event.photos.map((photo, index) => (
                  <button
                    key={photo.url}
                    type="button"
                    onClick={() => setActivePhoto(index)}
                    aria-label={`View photo ${index + 1}: ${photo.alt}`}
                    className={cn(
                      'group relative aspect-square cursor-pointer overflow-hidden rounded-control border bg-(--color-surface-raised) transition-all',
                      index === activePhoto
                        ? 'border-(--color-accent) ring-2 ring-(--color-accent)/40 scale-95'
                        : 'border-(--color-border) opacity-70 hover:opacity-100',
                    )}
                  >
                    <Image
                      src={photo.url}
                      alt={photo.alt}
                      fill
                      sizes="4.5rem"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
