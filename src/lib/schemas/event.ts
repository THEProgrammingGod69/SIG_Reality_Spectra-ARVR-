import { z } from 'zod';

import { CLUB_UTC_OFFSET_MINUTES } from '@/lib/dates';

import { CategorySchema } from './category';
import { entitySchemas, httpsUrl, instant, longText, recordId, text } from './fields';
import { ImageSchema } from './image';

/** How people attend. Order is the order the admin form offers them in. */
export const EVENT_MODES = [
  { id: 'offline', label: 'In person' },
  { id: 'online', label: 'Online' },
  { id: 'hybrid', label: 'In person and online' },
] as const;

export type EventMode = (typeof EVENT_MODES)[number]['id'];

/** Photos per event: enough for a full recap, few enough for one gallery page. */
export const MAX_EVENT_PHOTOS = 60;

const { input, record } = entitySchemas(
  {
    id: recordId,
    title: text(3, 80),
    category: CategorySchema,
    /** One or two sentences: the card text on /events. */
    summary: text(20, 160),
    /** Plain text; a blank line starts a new paragraph (shown as text, never HTML). */
    description: longText(5000),
    startsAt: instant,
    /** Omitted for a single-session event: see `eventEndsAt`. */
    endsAt: instant.nullable().default(null),
    venue: text(2, 120),
    mode: z.enum(EVENT_MODES.map((mode) => mode.id) as [EventMode, ...EventMode[]]),
    /** Where people register (typically VIERP). Registration never happens on this site. */
    registrationUrl: httpsUrl.nullable().default(null),
    poster: ImageSchema.nullable().default(null),
    /** Shown publicly while upcoming or running. Unpublished events are drafts. */
    published: z.boolean().default(false),
    /** What happened, written after the event for the timeline. */
    recap: longText(2000),
    photos: z.array(ImageSchema).max(MAX_EVENT_PHOTOS).default([]),
    /** On the public timeline (and its photos in the gallery). */
    inTimeline: z.boolean().default(false),
  },
  (event, ctx) => {
    if (event.endsAt !== null && event.endsAt <= event.startsAt) {
      ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'Must be after the start' });
    }
    if (event.published && event.registrationUrl === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['registrationUrl'],
        message: 'A published event needs a registration link',
      });
    }
    if (event.inTimeline && event.photos.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['photos'],
        message: 'Add at least one photo before putting an event on the timeline',
      });
    }
    const urls = new Set<string>();
    event.photos.forEach((photo, index) => {
      if (urls.has(photo.url)) {
        ctx.addIssue({ code: 'custom', path: ['photos', index], message: 'Duplicate photo' });
      }
      urls.add(photo.url);
    });
  },
);

/** The editable fields: the admin form, the Server Action and the seed script. */
export const EventInputSchema = input;
/** A stored event: every read is validated against this. */
export const EventSchema = record;

export type EventInput = z.input<typeof EventInputSchema>;
export type EventFields = z.output<typeof EventInputSchema>;
export type Event = z.output<typeof EventSchema>;

/* -------------------------------------------------------------------------- */
/* Phases — derived, never stored                                             */
/* -------------------------------------------------------------------------- */

/**
 * Where an event stands. Computed from the current time on every request
 * (rule 12), never stored, so nobody has to "move" an event when it ends:
 *
 * | Phase      | Rule                                  | Shown on                    |
 * | ---------- | ------------------------------------- | --------------------------- |
 * | `draft`    | not ended, not published              | admin only                  |
 * | `current`  | not ended, published                  | top of /events              |
 * | `awaiting` | ended, not on the timeline            | admin only, kept for later  |
 * | `timeline` | on the timeline (ended, ≥ 1 photo)    | /events timeline, /gallery  |
 */
export type EventPhase = 'draft' | 'current' | 'awaiting' | 'timeline';

const CLUB_UTC_OFFSET_MS = CLUB_UTC_OFFSET_MINUTES * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * When an event ends. Without an explicit end it runs to the end of its start
 * day in the club's time zone, so a 10:00 talk is still "current" at 14:00.
 */
export function eventEndsAt(event: Pick<EventFields, 'startsAt' | 'endsAt'>): Date {
  if (event.endsAt !== null) return new Date(event.endsAt);
  const localStart = Date.parse(event.startsAt) + CLUB_UTC_OFFSET_MS;
  return new Date(Math.floor(localStart / DAY_MS) * DAY_MS + DAY_MS - CLUB_UTC_OFFSET_MS);
}

export function hasEnded(event: Pick<EventFields, 'startsAt' | 'endsAt'>, now: Date): boolean {
  return eventEndsAt(event).getTime() <= now.getTime();
}

export function eventPhase(
  event: Pick<EventFields, 'startsAt' | 'endsAt' | 'published' | 'inTimeline'>,
  now: Date,
): EventPhase {
  if (event.inTimeline) return 'timeline';
  if (hasEnded(event, now)) return 'awaiting';
  return event.published ? 'current' : 'draft';
}
