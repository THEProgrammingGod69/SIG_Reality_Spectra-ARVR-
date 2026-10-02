import { existsSync } from 'node:fs';

import { afterAll, describe, expect, it } from 'vitest';

import { createR2Storage } from '@/lib/data/adapters/r2-storage';
import { createRedisStore } from '@/lib/data/adapters/redis-store';
import type { RepositoryDeps } from '@/lib/data/entity';
import { createEventsRepository } from '@/lib/data/events';
import { createGalleryRepository } from '@/lib/data/gallery';
import { createMedia } from '@/lib/data/media';
import { createTeamRepository } from '@/lib/data/team';

import { storeContract } from './store-contract';

/**
 * Live tests against the real Upstash database and R2 bucket — run with
 * `pnpm test:live` once `.env.local` has the Stage 5 variables. Skipped in the
 * everyday `pnpm test`.
 *
 * Every run works in a throwaway namespace (`test-…`), never the configured
 * DATA_NAMESPACE, and removes what it wrote, so it is safe against the
 * production database and bucket.
 */

const live = import.meta.env.MODE === 'live';
if (live && existsSync('.env.local')) process.loadEnvFile('.env.local');

const REQUIRED = [
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'R2_PUBLIC_BASE_URL',
] as const;
const value = (name: (typeof REQUIRED)[number]) => process.env[name] ?? '';

const throwaway = () => `test-${crypto.randomUUID().slice(0, 8)}`;
const redisFor = (namespace: string) =>
  createRedisStore({
    url: value('UPSTASH_REDIS_REST_URL'),
    token: value('UPSTASH_REDIS_REST_TOKEN'),
    namespace,
  });

describe.runIf(live)('live: configuration', () => {
  it('has every Stage 5 variable in .env.local', () => {
    expect(REQUIRED.filter((name) => !process.env[name])).toEqual([]);
  });
});

// The suites below build real clients while they are collected, so they are
// only declared in live mode rather than declared and skipped.
if (live) {
  storeContract('Upstash Redis', async () => {
    const store = redisFor(throwaway());
    return { store, cleanup: () => store.dropNamespace() };
  });
  lifecycleSuite();
}

function lifecycleSuite() {
  describe('live: a record’s whole life leaves nothing behind', () => {
    const namespace = throwaway();
    const store = redisFor(namespace);
    const storage = createR2Storage({
      accountId: value('R2_ACCOUNT_ID'),
      accessKeyId: value('R2_ACCESS_KEY_ID'),
      secretAccessKey: value('R2_SECRET_ACCESS_KEY'),
      bucket: value('R2_BUCKET'),
    });
    const media = createMedia({ storage, namespace, publicBaseUrl: value('R2_PUBLIC_BASE_URL') });
    const deps: RepositoryDeps = { store, media, invalidate: () => {}, now: () => new Date() };
    const events = createEventsRepository(deps);
    const gallery = createGalleryRepository(deps);
    const team = createTeamRepository({ ...deps, domainIds: ['finance'] });
    const admin = 'live-test@vit.edu';

    afterAll(async () => {
      await store.dropNamespace();
      await Promise.all((await media.listKeys()).map((key) => storage.delete(key)));
    });

    /** Exactly what the admin uploader does: ticket, then a PUT straight to R2. */
    async function upload(
      target: 'event-poster' | 'gallery-photo' | 'member-photo',
      recordId: string,
    ) {
      // The smallest valid WebP: a 1×1 lossless image.
      const body = Uint8Array.from(
        atob('UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=='),
        (char) => char.charCodeAt(0),
      );
      const ticket = await media.createUpload({
        target,
        recordId,
        contentType: 'image/webp',
        size: body.byteLength,
      });
      const response = await fetch(ticket.uploadUrl, {
        method: 'PUT',
        headers: ticket.headers,
        body,
      });
      expect(response.ok, await response.text()).toBe(true);
      return { url: ticket.url, alt: 'A one-pixel test image', width: 1, height: 1 };
    }

    it('creates, lists, updates and deletes, then no key or file remains', async () => {
      const eventId = crypto.randomUUID();
      const created = await events.create(
        {
          id: eventId,
          title: 'Live test event',
          category: 'workshop',
          summary: 'Created and deleted by the live test suite.',
          startsAt: new Date().toISOString(),
          venue: 'Nowhere',
          mode: 'online',
          poster: await upload('event-poster', eventId),
        },
        admin,
      );
      expect((await events.list()).map((event) => event.id)).toEqual([eventId]);

      const updated = await events.update(
        eventId,
        created.updatedAt,
        { poster: await upload('event-poster', eventId) },
        admin,
      );
      expect(await media.listKeys()).toHaveLength(1);

      const photoId = crypto.randomUUID();
      const photo = await gallery.create(
        { id: photoId, image: await upload('gallery-photo', photoId), category: 'other' },
        admin,
      );
      const memberId = crypto.randomUUID();
      const member = await team.create(
        {
          id: memberId,
          name: 'Live Test',
          position: 'Secretary',
          tier: 'secretary',
          domainId: 'finance',
          photo: await upload('member-photo', memberId),
        },
        admin,
      );
      expect(await store.scanKeys()).toHaveLength(6); // three records, three indexes

      await events.remove(eventId, updated.updatedAt);
      await gallery.remove(photoId, photo.updatedAt);
      await team.remove(memberId, member.updatedAt);

      expect(await store.scanKeys()).toEqual([]);
      expect(await media.listKeys()).toEqual([]);
    });
  });
}
