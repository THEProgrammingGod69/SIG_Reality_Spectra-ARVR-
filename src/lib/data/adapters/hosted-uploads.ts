import { createHmac, timingSafeEqual } from 'node:crypto';

import { MEDIA_KINDS } from '@/lib/schemas/upload';

import type { ObjectStorage } from './types';

/**
 * The upload half of storage the app serves itself — local data mode's
 * folder (D-031) and Netlify Blobs — where there is no bucket to presign
 * against: `/api/local-media` receives the browser's PUT and serves the file
 * back. Both backends share this module, so a signed URL means the same thing
 * on each, and so do the checks below.
 *
 * - **Signing**: an HMAC of the key and expiry under `AUTH_SECRET`, with a
 *   purpose prefix so the signature can never stand in for anything else the
 *   secret signs.
 * - **Receiving**: the body is stored only if the signature holds, its
 *   content type is an allowed media type that matches the key's extension,
 *   and it is within that kind's size limit. A signed URL can therefore never
 *   store `text/html` (or anything else) for the site to serve.
 * - **Parts**: a Netlify function takes a request body of about 6 MB, base64
 *   included, so the uploader sends a file larger than `HOSTED_UPLOAD_PART_BYTES`
 *   in parts to the same URL (`&part=i&parts=n`, in order). Each part is
 *   stored as `<key>.part-<i>`; the last one assembles the file and deletes
 *   the parts. Parts left by an abandoned upload are files no record
 *   mentions, so the nightly orphan sweep removes them.
 * - **Serving**: only files whose key and type are an allowed upload are
 *   served, so a nightly backup in the same storage is never public.
 */

/**
 * The largest part the uploader sends. A Netlify function's request body is
 * capped at about 6 MB and binary bodies arrive base64-encoded (4/3 larger),
 * so 4 MiB leaves headroom.
 */
export const HOSTED_UPLOAD_PART_BYTES = 4 * 1024 * 1024;

/** Ten MB in 4 MiB parts is three; anything near this is not our uploader. */
const MAX_PARTS = 16;

/** The largest file any upload target takes: the route refuses bigger bodies before reading them. */
export const MAX_HOSTED_UPLOAD_BYTES = Math.max(
  ...Object.values(MEDIA_KINDS).map((kind) => kind.maxBytes),
);

/** What came with the PUT: the signed query string, and the part, if any. */
export type UploadQuery = {
  expires: string | null;
  signature: string | null;
  part?: string | null;
  parts?: string | null;
};

/** Why an upload was refused, as the HTTP status the route answers with. */
export type ReceiveResult =
  | { ok: true; /** False for a part that is not the last. */ complete: boolean }
  | { ok: false; status: 400 | 403 | 409 | 413 | 415; reason: string };

/** A stored file, for the serving route. */
export type HostedFile = {
  body: Uint8Array | ReadableStream<Uint8Array>;
  contentType: string;
};

/** Storage the app hosts itself: the port, plus the route's two halves. */
export type HostedStorage = ObjectStorage & {
  /** An upload the browser PUT to a presigned URL: stored only if every check holds. */
  receive(
    key: string,
    query: UploadQuery,
    body: Uint8Array,
    contentType: string,
  ): Promise<ReceiveResult>;
  /** A stored upload and its type; null if there is none, or it is not a servable upload. */
  read(key: string): Promise<HostedFile | null>;
};

/** The content type without parameters (`image/webp; charset=x` → `image/webp`). */
function bareType(contentType: string): string {
  return contentType.split(';')[0]!.trim().toLowerCase();
}

/**
 * The size limit for a key whose extension `contentType` maps to, or null if
 * the pair is not an allowed upload. Every upload key ends in the extension
 * of its type (`media.ts`), so the key alone says what may be stored there.
 */
export function uploadKindOf(key: string, contentType: string): { maxBytes: number } | null {
  const type = bareType(contentType);
  const extension = key.slice(key.lastIndexOf('.') + 1);
  for (const kind of Object.values(MEDIA_KINDS)) {
    const types: Readonly<Record<string, string>> = kind.types;
    if (types[type] === extension) return { maxBytes: kind.maxBytes };
  }
  return null;
}

/** Whether a key ends in an upload's extension: what the serving route may look up at all. */
export function isUploadKey(key: string): boolean {
  const extension = key.slice(key.lastIndexOf('.') + 1);
  return Object.values(MEDIA_KINDS).some((kind) =>
    Object.values<string>(kind.types).includes(extension),
  );
}

function parsePart(query: UploadQuery): { index: number; count: number } | null | 'invalid' {
  if ((query.part ?? null) === null && (query.parts ?? null) === null) return null;
  const index = Number(query.part);
  const count = Number(query.parts);
  if (
    !Number.isInteger(index) ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > MAX_PARTS ||
    index < 0 ||
    index >= count
  ) {
    return 'invalid';
  }
  return { index, count };
}

export function partKey(key: string, index: number): string {
  return `${key}.part-${index}`;
}

export function createHostedUploads({
  secret,
  routePath,
  storage,
}: {
  secret: string;
  /** The route that receives and serves the files, e.g. /api/local-media. */
  routePath: string;
  /** The raw storage the parts and the assembled file are written to. */
  storage: Pick<ObjectStorage, 'put' | 'get' | 'delete'>;
}) {
  const sign = (key: string, expires: number) =>
    createHmac('sha256', secret).update(`sig-media-put\n${key}\n${expires}`).digest('hex');

  function signatureHolds(key: string, { expires, signature }: UploadQuery): boolean {
    const until = Number(expires);
    if (!signature || !Number.isFinite(until) || until < Date.now()) return false;
    const expected = Buffer.from(sign(key, until));
    const given = Buffer.from(signature);
    return expected.length === given.length && timingSafeEqual(expected, given);
  }

  return {
    async presignPut(key: string, expiresInSeconds: number): Promise<string> {
      const expires = Date.now() + expiresInSeconds * 1000;
      const query = new URLSearchParams({
        expires: String(expires),
        signature: sign(key, expires),
      });
      return `${routePath}/${key}?${query.toString()}`;
    },

    async receive(
      key: string,
      query: UploadQuery,
      body: Uint8Array,
      contentType: string,
    ): Promise<ReceiveResult> {
      if (!signatureHolds(key, query)) {
        return { ok: false, status: 403, reason: 'The upload link is not valid or has expired.' };
      }
      const kind = uploadKindOf(key, contentType);
      if (kind === null) {
        return { ok: false, status: 415, reason: 'Not an allowed file type for this upload.' };
      }
      if (body.byteLength > kind.maxBytes) {
        return { ok: false, status: 413, reason: 'The file is larger than this upload allows.' };
      }
      const type = bareType(contentType);
      const part = parsePart(query);
      if (part === 'invalid') {
        return { ok: false, status: 400, reason: 'The upload part is not valid.' };
      }
      if (part === null || part.count === 1) {
        await storage.put(key, body, type);
        return { ok: true, complete: true };
      }
      if (part.index < part.count - 1) {
        await storage.put(partKey(key, part.index), body, type);
        return { ok: true, complete: false };
      }

      // The last part: every earlier one must be there.
      const earlier = Array.from({ length: part.count - 1 }, (_, index) => partKey(key, index));
      const stored = await Promise.all(earlier.map((name) => storage.get(name)));
      if (stored.some((bytes) => bytes === null)) {
        return { ok: false, status: 409, reason: 'A part of this upload is missing. Try again.' };
      }
      const pieces = [...(stored as Uint8Array[]), body];
      const total = pieces.reduce((sum, piece) => sum + piece.byteLength, 0);
      if (total <= kind.maxBytes) {
        const file = new Uint8Array(total);
        let offset = 0;
        for (const piece of pieces) {
          file.set(piece, offset);
          offset += piece.byteLength;
        }
        await storage.put(key, file, type);
      }
      // Best effort: a part left behind is swept with the other orphans.
      await Promise.allSettled(earlier.map((name) => storage.delete(name)));
      return total <= kind.maxBytes
        ? { ok: true, complete: true }
        : { ok: false, status: 413, reason: 'The file is larger than this upload allows.' };
    },
  };
}
