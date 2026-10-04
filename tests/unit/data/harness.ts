import { vi } from 'vitest';

import { createMemoryStorage } from '@/lib/data/adapters/memory-storage';
import { createMemoryStore } from '@/lib/data/adapters/memory-store';
import type { RepositoryDeps } from '@/lib/data/entity';
import { createEventsRepository } from '@/lib/data/events';
import { createGalleryRepository } from '@/lib/data/gallery';
import { createMaintenance } from '@/lib/data/maintenance';
import { createMedia } from '@/lib/data/media';
import { createRecruitmentRepository } from '@/lib/data/recruitment';
import { createSponsorshipsRepository } from '@/lib/data/sponsorships';
import type { CacheTag } from '@/lib/data/tags';
import { createTeamRepository } from '@/lib/data/team';
import type { Image } from '@/lib/schemas/image';
import type { UploadTarget } from '@/lib/schemas/upload';

export const MEDIA_ORIGIN = 'https://media.example.org';
export const NAMESPACE = 'test';
export const DOMAIN_IDS = ['xr-development', 'web-development', 'finance'] as const;
export const ADMIN = 'admin@vit.edu';

/**
 * The whole data layer on in-memory adapters: the same repositories and media
 * logic the app runs, with a controllable clock and a spy for cache tags.
 */
export function createHarness(start = '2026-10-01T10:00:00.000Z') {
  const store = createMemoryStore();
  const clock = { now: new Date(start) };
  const now = () => new Date(clock.now);
  // Files are stamped by the same clock, so tests can age them for the sweep.
  const storage = createMemoryStorage({ now });
  const media = createMedia({ storage, namespace: NAMESPACE, publicBaseUrl: MEDIA_ORIGIN, now });
  const invalidated: CacheTag[][] = [];
  const invalidate = vi.fn((tags: readonly CacheTag[]) => {
    invalidated.push([...tags]);
  });
  const deps: RepositoryDeps = { store, media, invalidate, now };

  /**
   * Do what the admin uploader does: get a ticket, then PUT the file.
   * `uploadedSize` lets a test PUT more than the ticket declared, as a
   * tampered browser could.
   */
  async function upload(
    target: UploadTarget,
    recordId: string | null,
    {
      contentType = target === 'roles-pdf' ? 'application/pdf' : 'image/webp',
      size = 50_000,
      uploadedSize = size,
    }: { contentType?: string; size?: number; uploadedSize?: number } = {},
  ): Promise<string> {
    const ticket = await media.createUpload({ target, recordId, contentType, size });
    const key = ticket.url.slice(`${MEDIA_ORIGIN}/`.length);
    storage.simulateUpload(key, { size: uploadedSize, contentType });
    return ticket.url;
  }

  async function image(target: UploadTarget, recordId: string): Promise<Image> {
    return {
      url: await upload(target, recordId),
      alt: 'A photo from the event',
      width: 1600,
      height: 900,
    };
  }

  const repositories = {
    events: createEventsRepository(deps),
    gallery: createGalleryRepository(deps),
    team: createTeamRepository({ ...deps, domainIds: DOMAIN_IDS }),
    recruitment: createRecruitmentRepository(deps),
    sponsorships: createSponsorshipsRepository(deps),
  };

  return {
    store,
    storage,
    media,
    clock,
    invalidate,
    invalidated,
    upload,
    image,
    /** Advance the clock. */
    tick(ms: number) {
      clock.now = new Date(clock.now.getTime() + ms);
    },
    ...repositories,
    maintenance: createMaintenance({
      storage,
      namespace: NAMESPACE,
      repositories: Object.values(repositories),
      now,
    }),
  };
}

export type Harness = ReturnType<typeof createHarness>;

export const DAY = 24 * 60 * 60 * 1000;
