import {
  type MediaRef,
  UploadRequestSchema,
  type UploadTicket,
  type UploadTarget,
  uploadExtension,
  uploadFolder,
  uploadLimits,
} from '@/lib/schemas/upload';

import type { ObjectStorage } from './adapters/types';
import { InvalidDataError, MediaError } from './errors';
import { objectKey } from './keys';

/**
 * Uploaded files: posters, photos and the roles PDF (rule 11).
 *
 * 1. `createUpload` — the token route (`/api/admin/upload`) asks for a
 *    presigned PUT URL under the record the file belongs to.
 * 2. The browser PUTs the file straight to storage; with R2 it never passes
 *    through a function, whose request bodies are size-capped. Storage the
 *    app hosts itself receives it on its own route, in parts if the ticket
 *    says so (`partBytes`).
 * 3. `verify` — when a Server Action saves the record, every newly attached
 *    URL is checked: ours, filed under this record and this purpose, actually
 *    uploaded, an allowed type, within the size limit. A presigned PUT cannot
 *    cap the size itself, so an oversized or mistyped upload is deleted here.
 * 4. `remove` — files a record stops using are deleted after the record is
 *    saved. Uploads that are never attached are left to the nightly orphan
 *    sweep (`maintenance.ts`).
 */

/** How long a presigned upload URL stays valid. */
export const UPLOAD_URL_TTL_SECONDS = 5 * 60;

/** What the repositories need from media: check new files, delete old ones. */
export interface MediaStore {
  verify(ref: MediaRef): Promise<void>;
  /** Best effort: a failed delete is logged and left to the orphan sweep. */
  remove(urls: readonly string[]): Promise<void>;
}

export type MediaConfig = {
  storage: ObjectStorage;
  namespace: string;
  /** The public origin of the storage, e.g. https://media.example.org. */
  publicBaseUrl: string;
  /**
   * For storage the app receives uploads for itself (local data mode, Netlify
   * Blobs): the largest request body to send, so a bigger file goes in parts
   * (`adapters/hosted-uploads.ts`). Null for a bucket the browser PUTs to.
   */
  partBytes?: number | null;
  now?: () => Date;
};

export function createMedia({
  storage,
  namespace,
  publicBaseUrl,
  partBytes = null,
  now = () => new Date(),
}: MediaConfig) {
  const base = `${publicBaseUrl}/`;
  const ownPrefix = objectKey(namespace, '');

  /** The storage key behind one of our public URLs, or null for anything else. */
  function keyOf(url: string): string | null {
    if (!url.startsWith(base)) return null;
    const key = url.slice(base.length);
    return key.startsWith(ownPrefix) && !key.includes('..') ? key : null;
  }

  /** A fresh storage key for one file of this target and record. */
  function newKey(target: UploadTarget, recordId: string | null, contentType: string): string {
    const extension = uploadExtension(target, contentType);
    if (extension === null) throw new MediaError(`Not an allowed file type for ${target}`);
    return objectKey(
      namespace,
      `${uploadFolder(target, recordId)}${crypto.randomUUID()}.${extension}`,
    );
  }

  const media = {
    /** `request` is untrusted JSON from the browser; it is validated here. */
    async createUpload(request: unknown): Promise<UploadTicket> {
      const parsed = UploadRequestSchema.safeParse(request);
      if (!parsed.success)
        throw InvalidDataError.fromZod(parsed.error, 'This file cannot be uploaded.');
      const { target, recordId, contentType } = parsed.data;
      const key = newKey(target, recordId, contentType);
      return {
        uploadUrl: await storage.presignPut(key, UPLOAD_URL_TTL_SECONDS),
        headers: { 'Content-Type': contentType },
        url: base + key,
        expiresAt: new Date(now().getTime() + UPLOAD_URL_TTL_SECONDS * 1000).toISOString(),
        partBytes,
      };
    },

    /**
     * Store a file from the server (the seed script's demo images) and return
     * its public URL. Admin uploads never come this way (rule 11).
     */
    async putFile(
      target: UploadTarget,
      recordId: string | null,
      body: Uint8Array,
      contentType: string,
    ): Promise<string> {
      const key = newKey(target, recordId, contentType);
      await storage.put(key, body, contentType);
      return base + key;
    },

    async verify({ url, target, recordId }: MediaRef): Promise<void> {
      const key = keyOf(url);
      if (key === null) {
        throw new MediaError('A file was not uploaded through the admin panel. Upload it again.');
      }
      const folder = objectKey(namespace, uploadFolder(target, recordId));
      const name = key.slice(folder.length);
      if (!key.startsWith(folder) || name.includes('/')) {
        throw new MediaError(
          `A file belongs to a different record or field (${describe(target)}).`,
        );
      }

      const info = await storage.head(key);
      if (info === null) {
        throw new MediaError('A file upload did not finish. Upload it again.');
      }

      const { maxBytes } = uploadLimits(target);
      const extension = info.contentType ? uploadExtension(target, info.contentType) : null;
      const problem =
        extension === null || !name.endsWith(`.${extension}`)
          ? 'is not an allowed file type'
          : info.size === 0
            ? 'is empty'
            : info.size > maxBytes
              ? `is larger than ${Math.round(maxBytes / (1024 * 1024))} MB`
              : null;
      if (problem) {
        await storage.delete(key);
        throw new MediaError(`The uploaded ${describe(target)} ${problem}. It has been removed.`);
      }
    },

    async remove(urls: readonly string[]): Promise<void> {
      const keys = urls.map(keyOf).filter((key): key is string => key !== null);
      const results = await Promise.allSettled(keys.map((key) => storage.delete(key)));
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(
            `[data] Could not delete ${keys[index]}; the orphan sweep will retry.`,
            result.reason,
          );
        }
      });
    },

    /** Every stored key in this namespace (the tests check nothing is left behind). */
    async listKeys(): Promise<string[]> {
      return storage.list(ownPrefix);
    },
  } satisfies MediaStore & Record<string, unknown>;

  return media;
}

export type Media = ReturnType<typeof createMedia>;

function describe(target: UploadTarget): string {
  return {
    'event-poster': 'poster',
    'event-photo': 'event photo',
    'gallery-photo': 'gallery photo',
    'member-photo': 'team photo',
    'roles-pdf': 'roles PDF',
  }[target];
}
