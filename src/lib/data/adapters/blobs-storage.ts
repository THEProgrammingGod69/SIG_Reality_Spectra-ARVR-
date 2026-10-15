import {
  createHostedUploads,
  type HostedStorage,
  isUploadKey,
  uploadKindOf,
} from './hosted-uploads';
import type { BlobMetadata, MediaBlobs } from './netlify-blobs';
import type { ObjectInfo, ObjectStorage } from './types';

/**
 * `ObjectStorage` on Netlify Blobs: posters, photos, the roles PDF and the
 * nightly backups, in the site's own `sig-media` store under the same keys as
 * R2 (`{ns}/…`).
 *
 * The browser cannot PUT to Netlify Blobs directly, so uploads work as in
 * local data mode: `presignPut` signs a URL on `/api/local-media`, and that
 * route hands the body to `receive` (`hosted-uploads.ts`), which checks the
 * signature, type and size, and assembles a file sent in parts. The same
 * route serves the files back (`read`), streamed.
 *
 * The SDK's listing carries no size or date, so both are kept in each blob's
 * metadata with its content type: the attach check reads the size, the orphan
 * sweep the date.
 */
export function createBlobsStorage({
  blobs,
  routePath,
  secret,
}: {
  /** Called on first use, so nothing connects (or throws) at import. */
  blobs: () => MediaBlobs;
  /** The route that receives and serves the files, e.g. /api/local-media. */
  routePath: string;
  /** Signs upload URLs: AUTH_SECRET. */
  secret: string;
}): HostedStorage {
  function infoOf(metadata: BlobMetadata): ObjectInfo {
    const uploadedAt =
      typeof metadata.uploadedAt === 'string' ? new Date(metadata.uploadedAt) : null;
    return {
      // A missing size reads as 0, which the attach check refuses as empty.
      size: typeof metadata.size === 'number' ? metadata.size : 0,
      contentType: typeof metadata.contentType === 'string' ? metadata.contentType : null,
      lastModified: uploadedAt && !Number.isNaN(uploadedAt.getTime()) ? uploadedAt : null,
    };
  }

  async function put(key: string, body: string | Uint8Array, contentType: string) {
    const bytes = typeof body === 'string' ? new TextEncoder().encode(body) : body;
    // A copy, as an ArrayBuffer: the SDK takes no typed arrays.
    const data = new Uint8Array(bytes).buffer;
    await blobs().set(key, data, {
      metadata: { contentType, size: bytes.byteLength, uploadedAt: new Date().toISOString() },
    });
  }

  async function get(key: string): Promise<Uint8Array | null> {
    const data = await blobs().get(key, { type: 'arrayBuffer' });
    return data ? new Uint8Array(data) : null;
  }

  const remove = (key: string) => blobs().delete(key);

  const uploads = createHostedUploads({ secret, routePath, storage: { put, get, delete: remove } });

  const storage: ObjectStorage = {
    presignPut: uploads.presignPut,
    async head(key) {
      const found = await blobs().getMetadata(key);
      return found ? infoOf(found.metadata) : null;
    },
    get,
    put,
    delete: remove,
    async list(prefix) {
      const keys: string[] = [];
      for await (const page of blobs().list({ prefix, paginate: true })) {
        keys.push(...page.blobs.map((blob) => blob.key));
      }
      return keys.sort();
    },
  };

  return Object.assign(storage, {
    receive: uploads.receive,
    async read(key: string) {
      if (!isUploadKey(key)) return null; // Backups and upload parts are never served.
      const found = await blobs().getWithMetadata(key, { type: 'stream' });
      if (!found) return null;
      const { contentType } = infoOf(found.metadata);
      if (!contentType || uploadKindOf(key, contentType) === null) {
        await found.data.cancel();
        return null;
      }
      return { body: found.data, contentType };
    },
  });
}
