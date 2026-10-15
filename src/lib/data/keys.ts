/**
 * Every Redis key and storage object key, built from the deployment's
 * `DATA_NAMESPACE` — there are no hand-written key strings anywhere else.
 *
 * | Key / object                          | Holds                                   |
 * | ------------------------------------- | --------------------------------------- |
 * | `sig:{ns}:{collection}:{id}`          | hash: `data` (JSON) and `version`       |
 * | `sig:{ns}:{collection}:index`         | sorted set of the collection's ids      |
 * | `sig:{ns}:ratelimit:{key}`            | a counter that expires (rate limits)    |
 * | `{ns}/records/{collection}.json`      | Netlify Blobs: one collection's records |
 * | `{ns}/counters/{sha256(key)}`         | Netlify Blobs: a rate-limit counter     |
 * | `{ns}/{folder}{file}` (R2, Blobs)     | an uploaded file (see `UPLOAD_TARGETS`) |
 */

/** The record collections, one per entity. */
export const COLLECTIONS = ['event', 'gallery', 'member', 'settings', 'sponsorship'] as const;

export type Collection = (typeof COLLECTIONS)[number];

export function redisKeys(namespace: string) {
  const root = `sig:${namespace}`;
  return {
    record: (collection: Collection, id: string) => {
      if (id === 'index' || id.includes(':')) throw new Error(`Invalid record id "${id}"`);
      return `${root}:${collection}:${id}`;
    },
    index: (collection: Collection) => `${root}:${collection}:index`,
    /** A rate-limit counter (`RecordStore.hit`); expires with its window. */
    rateLimit: (key: string) => `${root}:ratelimit:${key}`,
    /** SCAN pattern matching every key of this namespace (maintenance and tests). */
    pattern: `${root}:*`,
  };
}

/** Keys in the Netlify Blobs records store (`adapters/blobs-store.ts`). */
export function blobKeys(namespace: string) {
  return {
    /** Every record of one collection, in one JSON blob. */
    collection: (collection: Collection) => `${namespace}/records/${collection}.json`,
    /** A rate-limit counter (`RecordStore.hit`); `hash` is the key's SHA-256, in hex. */
    counter: (hash: string) => `${namespace}/counters/${hash}`,
  };
}

/** The storage key of an uploaded file. */
export function objectKey(namespace: string, path: string): string {
  return `${namespace}/${path}`;
}
