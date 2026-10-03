import 'server-only';

import { join } from 'node:path';

import { domains } from '@/lib/content';
import { env, requireEnv } from '@/lib/env';
import { isConfigured } from '@/lib/integrations';
import { LOCAL_MEDIA_PATH } from '@/lib/schemas/fields';

import { createFileStorage, type FileStorage } from './adapters/file-storage';
import { createFileStore } from './adapters/file-store';
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

const isLocal = env.DATA_BACKEND === 'local';

/** Local data mode keeps everything here (gitignored), D-031. */
const LOCAL_DATA_DIR = join(process.cwd(), '.data');

let localFiles: FileStorage | undefined;

/** Local data mode's file storage, shared by the data layer and its route. */
function localFileStorage(): FileStorage {
  return (localFiles ??= createFileStorage({
    root: join(LOCAL_DATA_DIR, 'media'),
    routePath: LOCAL_MEDIA_PATH,
    secret: requireEnv('AUTH_SECRET', 'local file uploads'),
  }));
}

/** Local data mode's upload and file route; null when files live in R2. */
export function localMediaFiles(): FileStorage | null {
  return isLocal ? localFileStorage() : null;
}

/**
 * Whether records and files can be read and written here, and where they
 * live. Features check this before calling a service they cannot reach.
 */
export function dataAvailability() {
  return isLocal
    ? { backend: 'local' as const, records: true, files: Boolean(env.AUTH_SECRET) }
    : { backend: 'upstash' as const, records: isConfigured('redis'), files: isConfigured('r2') };
}

/**
 * Builds the real data layer for the app (`./index.ts`) and the seed script:
 * Upstash Redis and Cloudflare R2, or in local data mode a JSON file and a
 * folder under `.data/`. Each service connects on first use, so a missing
 * variable fails only the feature that needs it, with a message naming the
 * variable (`requireEnv`).
 */
export function createDataServices({ invalidate }: { invalidate: Invalidate }) {
  const namespace = env.DATA_NAMESPACE;

  let media: Media | undefined;
  const getMedia = () =>
    (media ??= isLocal
      ? createMedia({ namespace, publicBaseUrl: LOCAL_MEDIA_PATH, storage: localFileStorage() })
      : createMedia({
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
    store: isLocal
      ? createFileStore(join(LOCAL_DATA_DIR, `records-${namespace}.json`))
      : createRedisStore({
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
