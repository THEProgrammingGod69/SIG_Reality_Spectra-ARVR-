import {
  type SponsorshipForm,
  SponsorshipRequestInputSchema,
  SponsorshipRequestSchema,
  type SponsorshipStatus,
} from '@/lib/schemas/sponsorship';

import { createEntity, type RepositoryDeps } from './entity';

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
    count: entity.count,
    remove: entity.remove,

    /**
     * A visitor's request. The server assigns the id and the status after the
     * form's fields, so a crafted form cannot choose either.
     */
    submit(form: SponsorshipForm) {
      return entity.create({ ...form, id: crypto.randomUUID(), status: 'new' }, null);
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
