import 'server-only';

import { cacheLife, cacheTag, updateTag } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { connection } from 'next/server';

import { domains } from '@/lib/content';
import { DEFAULT_RECRUITMENT } from '@/lib/schemas/recruitment';

import { withoutAuthor } from './entity';
import { splitByPhase } from './events';
import { buildGallery } from './gallery';
import { createDataServices, dataAvailability, type DataServices } from './runtime';
import { TAGS } from './tags';
import { groupTeam } from './team';

/**
 * The data layer's front door: the only module the app imports from
 * `src/lib/data` (rule 2).
 *
 * - **Public reads** below are `'use cache'` functions tagged with
 *   `cacheTag`. They never read the current time (rule 12).
 * - **Admin reads and every write** go through `repositories()`. Writes call
 *   `updateTag` for the tags they change (rule 10), which Next.js allows only
 *   inside Server Actions — so writes are made from Server Actions, and the
 *   admin sees their own change on the next render.
 */

let services: DataServices | undefined;

export function repositories(): DataServices {
  return (services ??= createDataServices({
    invalidate: (tags) => {
      for (const tag of tags) updateTag(tag);
    },
  }));
}

/**
 * An admin page's read: fresh (never cached), at request time, and safe — if
 * no data store is configured, or the configured one fails, the page gets the
 * reason to show instead of an error.
 */
export async function adminRead<T>(
  what: string,
  load: (data: DataServices, now: Date) => Promise<T>,
): Promise<{ data: T } | { unavailable: 'not-configured' | 'unreachable' }> {
  if (!dataAvailability().records) return { unavailable: 'not-configured' };
  await connection();
  try {
    return { data: await load(repositories(), new Date()) };
  } catch (error) {
    unstable_rethrow(error);
    console.error(`[admin] Could not read ${what}.`, error);
    return { unavailable: 'unreachable' };
  }
}

/* -------------------------------------------------------------------------- */
/* Public reads                                                               */
/* -------------------------------------------------------------------------- */
// Admin saves refresh these at once through their tags; the `hours` lifetime
// only bounds how long a change made outside the panel (the seed script, a
// manual fix in Upstash) can take to appear. Where no data store is configured
// they return the empty state, so a public page never breaks (rule 9); an
// outage throws (and is not cached), for the page to report.

async function publicEvents() {
  'use cache';
  cacheTag(TAGS.events);
  cacheLife('hours');
  if (!dataAvailability().records) return [];
  return (await repositories().events.listPublic()).map(withoutAuthor);
}

/**
 * /events: the current events (soonest first) and the timeline (most recent
 * first). Which events are current depends on the time of the request, so it
 * is decided after `connection()`, outside the cache (rule 12): render it
 * inside a `<Suspense>` boundary.
 */
export async function getPublicEvents() {
  const events = await publicEvents();
  await connection();
  return splitByPhase(events, new Date());
}

/**
 * /gallery: photos of timeline events and standalone club photos, newest
 * first. Tagged with both sources.
 */
export async function getGallery() {
  'use cache';
  cacheTag(TAGS.events, TAGS.gallery);
  cacheLife('hours');
  if (!dataAvailability().records) return [];
  const data = repositories();
  const [events, photos] = await Promise.all([data.events.listPublic(), data.gallery.list()]);
  return buildGallery(events, photos);
}

/** /about: the core team, then the domain secretaries. */
export async function getTeam() {
  'use cache';
  cacheTag(TAGS.team);
  cacheLife('hours');
  if (!dataAvailability().records) return groupTeam([], []);
  const members = (await repositories().team.list()).map(withoutAuthor);
  return groupTeam(
    members,
    domains.map((domain) => domain.id),
  );
}

/** /recruitment and the navbar call to action. Closed until an admin saves. */
export async function getRecruitment() {
  'use cache';
  cacheTag(TAGS.recruitment);
  cacheLife('hours');
  if (!dataAvailability().records) return DEFAULT_RECRUITMENT;
  return repositories().recruitment.getStatus();
}

export type PublicEvents = Awaited<ReturnType<typeof getPublicEvents>>;
export type PublicTeam = Awaited<ReturnType<typeof getTeam>>;

export {
  AlreadyExistsError,
  ConflictError,
  DataError,
  InvalidDataError,
  MediaError,
  NotFoundError,
} from './errors';
export type { GalleryItem } from './gallery';
export { dataAvailability, localMediaFiles } from './runtime';
export type { DataServices } from './runtime';
