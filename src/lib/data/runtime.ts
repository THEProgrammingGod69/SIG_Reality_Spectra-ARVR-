import 'server-only';

import { domains } from '@/lib/content';
import { env, requireEnv } from '@/lib/env';

import { createR2Storage } from './adapters/r2-storage';
import { createRedisStore } from './adapters/redis-store';
import type { RepositoryDeps } from './entity';
import { createEventsRepository } from './events';
import { createGalleryRepository } from './gallery';
import { createMedia, type Media, type MediaStore } from './media';
import { createRecruitmentRepository } from './recruitment';
import { createSponsorshipsRepository } from './sponsorships';
import type { Invalidate } from './tags';
import { createTeamRepository } from './team';

/**
 * Builds the real data layer — Upstash Redis and Cloudflare R2, configured from
 * the environment — for the app (`./index.ts`) and the seed script. Each
 * service connects on first use, so a missing variable fails only the feature
 * that needs it, with a message naming the variable (`requireEnv`).
 */
export function createDataServices({ invalidate }: { invalidate: Invalidate }) {
  const namespace = env.DATA_NAMESPACE;

  let media: Media | undefined;
  const getMedia = () =>
    (media ??= createMedia({
      namespace,
      publicBaseUrl: requireEnv('R2_PUBLIC_BASE_URL', 'uploaded files'),
      storage: createR2Storage({
        accountId: requireEnv('R2_ACCOUNT_ID', 'uploaded files'),
        accessKeyId: requireEnv('R2_ACCESS_KEY_ID', 'uploaded files'),
        secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY', 'uploaded files'),
        bucket: requireEnv('R2_BUCKET', 'uploaded files'),
      }),
    }));
  const lazyMedia: MediaStore = {
    verify: (ref) => getMedia().verify(ref),
    remove: (urls) => getMedia().remove(urls),
  };

  const deps: RepositoryDeps = {
    store: createRedisStore({
      url: requireEnv('UPSTASH_REDIS_REST_URL', 'the data layer'),
      token: requireEnv('UPSTASH_REDIS_REST_TOKEN', 'the data layer'),
      namespace,
    }),
    media: lazyMedia,
    invalidate,
    now: () => new Date(),
  };

  return {
    namespace,
    events: createEventsRepository(deps),
    gallery: createGalleryRepository(deps),
    team: createTeamRepository({ ...deps, domainIds: domains.map((domain) => domain.id) }),
    recruitment: createRecruitmentRepository(deps),
    sponsorships: createSponsorshipsRepository(deps),
    /** Upload tickets and the orphan sweep's file listing. */
    get media(): Media {
      return getMedia();
    },
  };
}

export type DataServices = ReturnType<typeof createDataServices>;
