import { randomUUID } from 'node:crypto';

import { getStore, type Store } from '@netlify/blobs';

/**
 * What the Netlify Blobs adapters (`blobs-store.ts`, `blobs-storage.ts`)
 * share: opening a store, the slice of the SDK they call, and the
 * compare-and-swap loop that makes a blob behave like one atomic record.
 *
 * Facts about `@netlify/blobs` 11 this file is built around:
 *
 * - Reads default to *eventual* consistency (an edge cache, up to 60 s
 *   stale). Every store here is opened `strong`, or an admin's save could be
 *   re-rendered from the copy before it and cached by `updateTag`.
 * - A conditional write (`onlyIfMatch` / `onlyIfNew`) answers
 *   `{ modified: false }` when the condition fails, but reports any *other*
 *   failure (401, 5xx after retries…) as `{ modified: true, etag: '' }`. A
 *   write with no etag is therefore checked by reading back its `writeId`.
 * - On Netlify the function's environment carries the credentials; on a
 *   laptop (`pnpm seed`, `pnpm data`) a site id and personal access token
 *   reach the same stores through the API.
 */

export type BlobMetadata = Record<string, unknown>;
export type BlobWriteResult = { modified: boolean; etag?: string };
export type WriteCondition = { onlyIfNew: true } | { onlyIfMatch: string };

/** The calls `blobs-store.ts` makes: JSON documents written by compare-and-swap. */
export interface RecordBlobs {
  getWithMetadata(
    key: string,
    options: { type: 'json'; consistency?: 'strong' },
  ): Promise<{ data: unknown; etag?: string; metadata: BlobMetadata } | null>;
  setJSON(key: string, data: unknown, options?: WriteCondition): Promise<BlobWriteResult>;
}

/** The calls `blobs-storage.ts` makes: files, with their type, size and date in metadata. */
export interface MediaBlobs {
  get(key: string, options: { type: 'arrayBuffer' }): Promise<ArrayBuffer | null>;
  getWithMetadata(
    key: string,
    options: { type: 'stream' },
  ): Promise<{ data: ReadableStream<Uint8Array>; metadata: BlobMetadata } | null>;
  getMetadata(key: string): Promise<{ metadata: BlobMetadata } | null>;
  set(
    key: string,
    data: string | ArrayBuffer,
    options: { metadata: BlobMetadata },
  ): Promise<BlobWriteResult>;
  delete(key: string): Promise<void>;
  list(options: { prefix: string; paginate: true }): AsyncIterable<{ blobs: { key: string }[] }>;
}

/** Where the records live (one JSON blob per collection) and where the files do. */
export const BLOB_STORES = { records: 'sig-records', media: 'sig-media' } as const;

/**
 * The `fetch` the SDK is given.
 *
 * - `cache: 'no-store'`: a Blobs read must always reach the store, as an
 *   Upstash read does, never Next.js's data cache.
 * - Every body is read here, in full. Next.js patches `fetch` and hands back
 *   one branch of a tee'd body; the SDK cancels the body of every response it
 *   does not read (a 404, a 412, a delete), and cancelling one branch of a
 *   tee waits for the other forever — a missing file would hang its request.
 *   A fresh response over the bytes cancels at once. The bodies are small
 *   (records, files of at most 10 MB), so holding one in memory is fine.
 */
export const blobsFetch: typeof fetch = async (input, init) => {
  const response = await globalThis.fetch(input, { ...init, cache: 'no-store' });
  const body = await response.arrayBuffer();
  return new Response(body.byteLength > 0 ? body : null, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};

/**
 * Whether this process runs inside Netlify, which hands the SDK its
 * credentials. Read where the SDK reads them: a global, or the platform's
 * `Netlify.env` (not always mirrored in `process.env`), else `process.env`.
 */
function hasNetlifyContext(): boolean {
  const scope = globalThis as {
    netlifyBlobsContext?: unknown;
    Netlify?: { env?: { get(key: string): string | undefined } };
  };
  const environment = scope.Netlify?.env;
  return Boolean(
    scope.netlifyBlobsContext ||
    (environment ? environment.get('NETLIFY_BLOBS_CONTEXT') : process.env.NETLIFY_BLOBS_CONTEXT),
  );
}

/**
 * Open one site-wide store with strong consistency. Inside Netlify the
 * environment supplies everything; elsewhere `siteID` and `token` (a personal
 * access token) are used when both are given. Without either, the SDK throws
 * `MissingBlobsEnvironmentError` — at first use, since callers open stores
 * lazily, so a build or a dev server without Netlify never fails at import.
 */
export function openBlobStore(
  name: string,
  { siteID, token }: { siteID?: string; token?: string } = {},
): Store {
  const api = !hasNetlifyContext() && siteID && token ? { siteID, token } : {};
  return getStore({ name, consistency: 'strong', fetch: blobsFetch, ...api });
}

/**
 * Runs tasks for one key one after another within this process. Concurrent
 * saves from one Server Action (a batch of gallery photos) then queue instead
 * of racing each other's compare-and-swap; only writes from other instances
 * still contend, and the retry loop absorbs those.
 */
export function createKeyedQueue() {
  const tails = new Map<string, Promise<unknown>>();
  return function run<T>(key: string, task: () => Promise<T>): Promise<T> {
    const previous = tails.get(key) ?? Promise.resolve();
    const next = previous.then(task, task);
    const tail = next.catch(() => undefined);
    tails.set(key, tail);
    void tail.then(() => {
      if (tails.get(key) === tail) tails.delete(key);
    });
    return next;
  };
}

const warnedNoEtag = new Set<string>();
function warnNoEtag(key: string) {
  if (warnedNoEtag.has(key)) return;
  warnedNoEtag.add(key);
  console.warn(`[data] "${key}" came back without an etag; saving it without compare-and-swap.`);
}

/** How many times a contended write is retried before giving up. */
export const CAS_ATTEMPTS = 8;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Exponential backoff with full jitter: 25 ms, 50 ms, … capped at 1 s. */
const backoff = (attempt: number) => Math.random() * Math.min(1000, 25 * 2 ** attempt);

/**
 * Read a JSON document, compute its next value, write it only if nobody wrote
 * in between (its etag still matches), and start over if somebody did. Each
 * write carries a fresh `writeId`, so a write whose outcome the SDK cannot
 * report (see above) is confirmed by reading it back.
 *
 * `next` may throw to abort (a failed record check); nothing is written then.
 * Resolves to the value that was stored.
 */
export async function compareAndSwap<T extends object>(
  blobs: RecordBlobs,
  key: string,
  parse: (data: unknown) => T,
  next: (current: T | null) => T | Promise<T>,
  { attempts = CAS_ATTEMPTS }: { attempts?: number } = {},
): Promise<T> {
  /** Values already sent, by writeId: one may have landed although the reply said no. */
  const sent = new Map<string, T>();
  const writeIdOf = (data: unknown) =>
    data && typeof data === 'object' && 'writeId' in data ? String(data.writeId) : null;

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) await sleep(backoff(attempt));
    const current = await blobs.getWithMetadata(key, { type: 'json', consistency: 'strong' });
    const landed = sent.get(writeIdOf(current?.data) ?? '');
    if (landed) return landed;

    const value = await next(current ? parse(current.data) : null);
    const writeId = randomUUID();
    sent.set(writeId, value);
    // A document read back without an etag (a store that does not report one)
    // cannot be compared: it is written as is and confirmed by its writeId
    // below, rather than refused — the in-process queue still orders this
    // instance's writes (D-041).
    if (current && !current.etag) warnNoEtag(key);
    const condition: WriteCondition | undefined = !current
      ? { onlyIfNew: true }
      : current.etag
        ? { onlyIfMatch: current.etag }
        : undefined;
    const result = await blobs.setJSON(key, { ...value, writeId }, condition);
    if (!condition) {
      const check = await blobs.getWithMetadata(key, { type: 'json', consistency: 'strong' });
      if (writeIdOf(check?.data) === writeId) return value;
      continue; // Overwritten in between: read again and redo it.
    }
    if (!result.modified) continue; // Somebody else wrote first: read again.
    if (result.etag) return value;

    const check = await blobs.getWithMetadata(key, { type: 'json', consistency: 'strong' });
    if (writeIdOf(check?.data) === writeId) return value;
    throw new Error('The data store did not confirm the save. Try again in a moment.');
  }
  throw new Error('Too many saves at the same moment. Try again in a moment.');
}
