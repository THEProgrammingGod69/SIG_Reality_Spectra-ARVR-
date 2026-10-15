import 'server-only';

import { join } from 'node:path';

import { domains } from '@/lib/content';
import { env, requireEnv } from '@/lib/env';
import { isConfigured } from '@/lib/integrations';
import { LOCAL_MEDIA_PATH } from '@/lib/schemas/fields';

import { createBlobsStorage } from './adapters/blobs-storage';
import { createBlobsStore } from './adapters/blobs-store';
import { createFileStorage } from './adapters/file-storage';
import { createFileStore } from './adapters/file-store';
import { HOSTED_UPLOAD_PART_BYTES, type HostedStorage } from './adapters/hosted-uploads';
import { BLOB_STORES, openBlobStore } from './adapters/netlify-blobs';
import { createR2Storage } from './adapters/r2-storage';
import { createRedisStore } from './adapters/redis-store';
import type { ObjectStorage } from './adapters/types';
import type { RepositoryDeps } from './entity';
import { createEventsRepository } from './events';
import { createGalleryRepository } from './gallery';
import { createMaintenance, type Maintenance } from './maintenance';
import { createMedia, type Media, type MediaStore } from './media';
import { createRecruitmentRepository } from './recruitment';
import { createSponsorshipsRepository } from './sponsorships';
import type { Invalidate } from './tags';
import { createTeamRepository } from './team';

const backend = env.DATA_BACKEND;
const isLocal = backend === 'local';
const isBlobs = backend === 'netlify-blobs';

/** Local data mode keeps everything here (gitignored), D-031. */
const LOCAL_DATA_DIR = join(process.cwd(), '.data');

/**
 * Netlify Blobs stores, opened on first use: on Netlify the function's
 * environment supplies the credentials; the command-line tools use
 * NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN.
 */
const blobStores: Partial<Record<keyof typeof BLOB_STORES, ReturnType<typeof openBlobStore>>> = {};
function blobStore(which: keyof typeof BLOB_STORES) {
  return (blobStores[which] ??= openBlobStore(BLOB_STORES[which], {
    siteID: env.NETLIFY_SITE_ID,
    token: env.NETLIFY_AUTH_TOKEN,
  }));
}

let hostedFiles: HostedStorage | undefined;

/**
 * File storage the app serves itself — local data mode's folder or Netlify
 * Blobs — shared by the data layer and the `/api/local-media` route.
 */
function hostedStorage(): HostedStorage {
  const secret = requireEnv('AUTH_SECRET', isLocal ? 'local file uploads' : 'file uploads');
  return (hostedFiles ??= isLocal
    ? createFileStorage({
        root: join(LOCAL_DATA_DIR, 'media'),
        routePath: LOCAL_MEDIA_PATH,
        secret,
      })
    : createBlobsStorage({ blobs: () => blobStore('media'), routePath: LOCAL_MEDIA_PATH, secret }));
}

/**
 * The upload and file route's storage when the app hosts the files itself
 * (local data mode, Netlify Blobs); null when they live in R2, which serves
 * them from its own domain.
 */
export function hostedMediaFiles(): HostedStorage | null {
  return isLocal || isBlobs ? hostedStorage() : null;
}

/**
 * Whether records and files can be read and written here, and where they
 * live. Features check this before calling a service they cannot reach.
 */
export function dataAvailability() {
  if (isLocal) return { backend, records: true, files: Boolean(env.AUTH_SECRET) };
  // Netlify supplies the Blobs credentials; uploads are signed with AUTH_SECRET.
  if (isBlobs) return { backend, records: true, files: Boolean(env.AUTH_SECRET) };
  return { backend, records: isConfigured('redis'), files: isConfigured('r2') };
}

/**
 * Builds the real data layer for the app (`./index.ts`) and the seed script:
 * Netlify Blobs; Upstash Redis and Cloudflare R2; or in local data mode a
 * JSON file and a folder under `.data/`. Each service connects on first use, so a missing
 * variable fails only the feature that needs it, with a message naming the
 * variable (`requireEnv`).
 */
export function createDataServices({ invalidate }: { invalidate: Invalidate }) {
  const namespace = env.DATA_NAMESPACE;

  let storage: ObjectStorage | undefined;
  const getStorage = () =>
    (storage ??=
      isLocal || isBlobs
        ? hostedStorage()
        : createR2Storage({
            accountId: requireEnv('R2_ACCOUNT_ID', 'uploaded files'),
            accessKeyId: requireEnv('R2_ACCESS_KEY_ID', 'uploaded files'),
            secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY', 'uploaded files'),
            bucket: requireEnv('R2_BUCKET', 'uploaded files'),
          }));

  let media: Media | undefined;
  const getMedia = () =>
    (media ??= createMedia({
      namespace,
      publicBaseUrl:
        isLocal || isBlobs ? LOCAL_MEDIA_PATH : requireEnv('R2_PUBLIC_BASE_URL', 'uploaded files'),
      storage: getStorage(),
      // The app receives these uploads itself, through a size-capped function.
      partBytes: isLocal || isBlobs ? HOSTED_UPLOAD_PART_BYTES : null,
    }));
  const lazyMedia: MediaStore = {
    verify: (ref) => getMedia().verify(ref),
    remove: (urls) => getMedia().remove(urls),
  };

  const deps: RepositoryDeps = {
    store: isLocal
      ? createFileStore(join(LOCAL_DATA_DIR, `records-${namespace}.json`))
      : isBlobs
        ? createBlobsStore({ blobs: () => blobStore('records'), namespace })
        : createRedisStore({
            url: requireEnv('UPSTASH_REDIS_REST_URL', 'the data layer'),
            token: requireEnv('UPSTASH_REDIS_REST_TOKEN', 'the data layer'),
            namespace,
          }),
    media: lazyMedia,
    invalidate,
    now: () => new Date(),
  };

  const repositories = {
    events: createEventsRepository(deps),
    gallery: createGalleryRepository(deps),
    team: createTeamRepository({ ...deps, domainIds: domains.map((domain) => domain.id) }),
    recruitment: createRecruitmentRepository(deps),
    sponsorships: createSponsorshipsRepository(deps),
  };

  let maintenance: Maintenance | undefined;
  return {
    namespace,
    ...repositories,
    /** Upload tickets and server-side file writes. */
    get media(): Media {
      return getMedia();
    },
    /** The nightly backup and orphan sweep, and restore (D-034). */
    get maintenance(): Maintenance {
      return (maintenance ??= createMaintenance({
        storage: getStorage(),
        namespace,
        repositories: Object.values(repositories),
      }));
    },
  };
}

export type DataServices = ReturnType<typeof createDataServices>;
