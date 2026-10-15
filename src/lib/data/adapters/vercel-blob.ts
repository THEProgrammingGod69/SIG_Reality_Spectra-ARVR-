import {
  BlobError,
  BlobNotFoundError,
  BlobPreconditionFailedError,
  del,
  get,
  head,
  list,
  put,
} from '@vercel/blob';

import type {
  BlobMetadata,
  BlobWriteResult,
  MediaBlobs,
  RecordBlobs,
  WriteCondition,
} from './netlify-blobs';

/**
 * Vercel Blob behind the same two slices of a blob store the Netlify Blobs
 * adapters use (`RecordBlobs`, `MediaBlobs`), so `blobs-store.ts` and
 * `blobs-storage.ts` run unchanged on Vercel (D-040).
 *
 * Facts about `@vercel/blob` 2 this file is built around:
 *
 * - One store holds everything, so each logical store (`sig-records`,
 *   `sig-media`) is a pathname prefix. Blobs are private: only the server's
 *   token reads them, and files reach visitors through `/api/local-media`.
 * - Reads pass `useCache: false`, which skips the CDN and reads the origin, so
 *   a save is never re-rendered from the copy before it.
 * - `put` with `ifMatch` is a compare-and-swap (a stale etag throws
 *   `BlobPreconditionFailedError`); without `allowOverwrite` it only creates,
 *   and refuses an existing pathname. Both refusals answer `modified: false`,
 *   which is what the compare-and-swap loop expects.
 * - The store reports each blob's content type, size and upload time itself,
 *   so the metadata the media adapter reads is rebuilt from those.
 */

type Options = { token?: string };

/** The metadata `blobs-storage.ts` reads, from what Vercel Blob reports. */
function metadataOf(blob: {
  contentType: string | null;
  size: number | null;
  uploadedAt: Date;
}): BlobMetadata {
  return {
    ...(blob.contentType ? { contentType: blob.contentType } : {}),
    ...(blob.size !== null ? { size: blob.size } : {}),
    uploadedAt: blob.uploadedAt.toISOString(),
  };
}

function storeOf(name: string, { token }: Options) {
  const pathOf = (key: string) => `${name}/${key}`;

  /** The blob's current bytes and details, from the origin; null when it does not exist. */
  async function read(key: string) {
    const found = await get(pathOf(key), { access: 'private', useCache: false, token });
    return found && found.statusCode === 200 ? found : null;
  }

  async function write(
    key: string,
    body: string | ArrayBuffer,
    contentType: string,
    condition?: WriteCondition,
  ): Promise<BlobWriteResult> {
    const rule =
      condition && 'onlyIfMatch' in condition
        ? { ifMatch: condition.onlyIfMatch }
        : { allowOverwrite: !condition };
    try {
      const result = await put(pathOf(key), Buffer.from(body as ArrayBuffer), {
        access: 'private',
        addRandomSuffix: false,
        contentType,
        token,
        ...rule,
      });
      return { modified: true, etag: result.etag };
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError) return { modified: false };
      // "Create only" refused because the pathname already exists.
      if (
        condition &&
        'onlyIfNew' in condition &&
        error instanceof BlobError &&
        /already exists/i.test(error.message)
      ) {
        return { modified: false };
      }
      throw error;
    }
  }

  return { pathOf, read, write };
}

/** Records: JSON documents written by compare-and-swap (`blobs-store.ts`). */
export function vercelRecordBlobs(name: string, options: Options = {}): RecordBlobs {
  const store = storeOf(name, options);
  return {
    async getWithMetadata(key) {
      const found = await store.read(key);
      if (!found) return null;
      const data: unknown = await new Response(found.stream).json();
      return { data, etag: found.blob.etag, metadata: metadataOf(found.blob) };
    },
    setJSON(key, data, condition) {
      return store.write(key, JSON.stringify(data), 'application/json', condition);
    },
  };
}

/** Files: bytes with their type, size and date (`blobs-storage.ts`). */
export function vercelMediaBlobs(name: string, options: Options = {}): MediaBlobs {
  const store = storeOf(name, options);
  const { token } = options;
  return {
    async get(key) {
      const found = await store.read(key);
      return found ? new Response(found.stream).arrayBuffer() : null;
    },
    async getWithMetadata(key) {
      const found = await store.read(key);
      return found ? { data: found.stream, metadata: metadataOf(found.blob) } : null;
    },
    async getMetadata(key) {
      try {
        return { metadata: metadataOf(await head(store.pathOf(key), { token })) };
      } catch (error) {
        if (error instanceof BlobNotFoundError) return null;
        throw error;
      }
    },
    set(key, data, { metadata }) {
      const contentType =
        typeof metadata.contentType === 'string'
          ? metadata.contentType
          : 'application/octet-stream';
      return store.write(key, data, contentType);
    },
    async delete(key) {
      await del(store.pathOf(key), { token });
    },
    list({ prefix }) {
      const start = store.pathOf('');
      return {
        async *[Symbol.asyncIterator]() {
          let cursor: string | undefined;
          do {
            const page = await list({ prefix: store.pathOf(prefix), cursor, limit: 1000, token });
            yield { blobs: page.blobs.map((blob) => ({ key: blob.pathname.slice(start.length) })) };
            cursor = page.hasMore ? page.cursor : undefined;
          } while (cursor);
        },
      };
    },
  };
}
