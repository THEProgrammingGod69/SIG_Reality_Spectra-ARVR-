import {
  type SponsorshipForm,
  SponsorshipFormSchema,
  SponsorshipRequestInputSchema,
  SponsorshipRequestSchema,
  type SponsorshipStatus,
} from '@/lib/schemas/sponsorship';

import { createEntity, type RepositoryDeps } from './entity';
import { InvalidDataError, RateLimitedError } from './errors';

/**
 * How many requests one sender may make in a window: generous for a real
 * organisation, a wall for a script (D-032).
 */
export const SUBMISSION_LIMIT = { requests: 3, windowSeconds: 60 * 60 } as const;

/**
 * The rate-limit key for a sender: a hash of their address, so the counter
 * never stores an IP address itself.
 */
async function senderKey(sender: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sender));
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0'));
  return `sponsorship:${hex.join('').slice(0, 32)}`;
}

/**
 * Sponsorship and collaboration requests: written by the public /contact form,
 * read only in /admin/sponsorships. Never cached, so no cache tags.
 */
export function createSponsorshipsRepository(deps: RepositoryDeps) {
  const entity = createEntity(deps, {
    label: 'This request',
    collection: 'sponsorship',
    input: SponsorshipRequestInputSchema,
    record: SponsorshipRequestSchema,
    id: (request) => request.id,
    score: (request) => Date.parse(request.createdAt),
    tags: [],
  });

  return {
    get: entity.get,
    maintenance: entity.maintenance,
    count: entity.count,
    remove: entity.remove,

    /**
     * A visitor's request. The server assigns the id and the status after the
     * form's fields, so a crafted form cannot choose either. `from` (the
     * sender's IP address) counts against `SUBMISSION_LIMIT`; only a valid
     * request uses up an attempt. The seed script leaves it out.
     */
    async submit(form: SponsorshipForm, { from }: { from?: string } = {}) {
      const parsed = SponsorshipFormSchema.safeParse(form);
      if (!parsed.success) throw InvalidDataError.fromZod(parsed.error);
      if (from !== undefined) {
        const hits = await deps.store.hit(await senderKey(from), SUBMISSION_LIMIT.windowSeconds);
        if (hits > SUBMISSION_LIMIT.requests) {
          throw new RateLimitedError(
            'Several requests have already been sent from your network. Please try again in an hour, or reach the club through its channels.',
          );
        }
      }
      return entity.create({ ...parsed.data, id: crypto.randomUUID(), status: 'new' }, null);
    },

    /** Newest first, a page at a time. */
    list(page: { offset?: number; limit?: number } = {}) {
      return entity.list({ ...page, order: 'desc' });
    },

    setStatus(id: string, expectedUpdatedAt: string, status: SponsorshipStatus, actor: string) {
      return entity.update(id, expectedUpdatedAt, { status }, actor);
    },
  };
}

export type SponsorshipsRepository = ReturnType<typeof createSponsorshipsRepository>;
