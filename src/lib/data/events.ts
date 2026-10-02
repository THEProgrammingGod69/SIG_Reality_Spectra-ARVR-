import {
  type Event,
  EventInputSchema,
  type EventFields,
  eventPhase,
  EventSchema,
  hasEnded,
} from '@/lib/schemas/event';

import { createEntity, type RepositoryDeps } from './entity';
import { InvalidDataError } from './errors';
import { TAGS } from './tags';

/**
 * Events: the current event, the timeline, and — through their photos — half
 * of the gallery. The gallery's cached read is tagged `events` too, so an
 * event write refreshes it without a second tag.
 */
export function createEventsRepository(deps: RepositoryDeps) {
  const entity = createEntity(deps, {
    label: 'This event',
    collection: 'event',
    input: EventInputSchema,
    record: EventSchema,
    id: (event) => event.id,
    score: (event) => Date.parse(event.startsAt),
    tags: [TAGS.events],
    files: (event: EventFields) => [
      ...(event.poster
        ? [{ url: event.poster.url, target: 'event-poster' as const, recordId: event.id }]
        : []),
      ...event.photos.map((photo) => ({
        url: photo.url,
        target: 'event-photo' as const,
        recordId: event.id,
      })),
    ],
    check: (event, { now }) => {
      if (event.inTimeline && !hasEnded(event, now)) {
        throw new InvalidDataError('An event can go on the timeline only after it has ended.', [
          { path: 'inTimeline', message: 'The event has not ended yet' },
        ]);
      }
    },
  });

  return {
    ...entity,

    /**
     * Events the public may see — published, or on the timeline — in start
     * order. Which of them is current is decided per request (`splitByPhase`).
     */
    async listPublic(): Promise<Event[]> {
      return (await entity.list()).filter((event) => event.published || event.inTimeline);
    },
  };
}

export type EventsRepository = ReturnType<typeof createEventsRepository>;

type Phased = Pick<EventFields, 'startsAt' | 'endsAt' | 'published' | 'inTimeline'>;

/**
 * Split public events by phase at `now` (rule 12: called per request, never
 * inside a cached function). Current events come soonest first, the timeline
 * most recent first.
 */
export function splitByPhase<E extends Phased>(events: readonly E[], now: Date) {
  const byStart = (a: E, b: E) => Date.parse(a.startsAt) - Date.parse(b.startsAt);
  return {
    current: events.filter((event) => eventPhase(event, now) === 'current').sort(byStart),
    timeline: events
      .filter((event) => eventPhase(event, now) === 'timeline')
      .sort((a, b) => byStart(b, a)),
  };
}
