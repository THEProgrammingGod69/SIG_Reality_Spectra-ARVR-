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
import { createSignInLimit, type SignInAttempt, type SignInLimit } from './sign-in-limit';
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

/**
 * A public page's read, made safe: if the data store fails, the page gets
 * `failed` and shows a calm "could not be loaded" message instead of an error
 * page (rule 9). Next.js's own signals, such as "render this at request
 * time", pass straight through.
 */
export async function publicRead<T>(
  what: string,
  load: () => Promise<T>,
): Promise<{ data: T } | { failed: true }> {
  // Netlify Blobs is reachable from functions, not from the build: rather than
  // bake (and cache) the empty state while prerendering, wait for a request.
  const { backend, records } = dataAvailability();
  if (backend === 'netlify-blobs' && !records) await connection();
  try {
    return { data: await load() };
  } catch (error) {
    unstable_rethrow(error);
    console.error(`[site] Could not load ${what}.`, error);
    return { failed: true };
  }
}

let offlineSignIns: SignInLimit | undefined;

/**
 * Count one admin password sign-in attempt; false when the client or the
 * email has made too many and it must be refused (`SIGN_IN_LIMITS`). Counted
 * in the data store where there is one, in memory where there is not.
 */
export function allowSignInAttempt(attempt: SignInAttempt): Promise<boolean> {
  const limit = dataAvailability().records
    ? repositories().signIns
    : (offlineSignIns ??= createSignInLimit({ store: null }));
  return limit.allow(attempt);
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
 * first. Tagged with both sources. The club archive is Git content, not
 * store data: the page merges it in (`mergeGallery`), so it shows even when
 * this read returns nothing or fails.
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
  RateLimitedError,
} from './errors';
export { mergeGallery, type GalleryItem } from './gallery';
export { SIGN_IN_LIMITS, type SignInAttempt } from './sign-in-limit';
export { groupTeam } from './team';
export { MAX_HOSTED_UPLOAD_BYTES } from './adapters/hosted-uploads';
export { dataAvailability, hostedMediaFiles } from './runtime';
export type { DataServices } from './runtime';
