import { createHash } from 'node:crypto';

import { z } from 'zod';

import { blobKeys, type Collection } from '../keys';
import { createMemoryStore, type StoreSnapshot } from './memory-store';
import { compareAndSwap, createKeyedQueue, type RecordBlobs } from './netlify-blobs';
import { assertDistinctRecords, type RecordStore, type WriteOp } from './types';

/** One collection's blob: every record of it, as the memory store keeps them. */
const CollectionBlobSchema = z.object({
  records: z.record(
    z.string(),
    z.object({ data: z.string(), version: z.string(), score: z.number() }),
  ),
});
type CollectionBlob = z.infer<typeof CollectionBlobSchema>;

const CounterBlobSchema = z.object({ hits: z.int().min(1), expiresAt: z.number() });

function parseWith<T>(schema: z.ZodType<T>, what: string) {
  return (data: unknown): T => {
    const parsed = schema.safeParse(data);
    if (!parsed.success) throw new Error(`The stored ${what} is not in the expected format.`);
    return parsed.data;
  };
}

/** A write spanning collections that was applied to some of them only. */
export class PartialWriteError extends Error {
  constructor(written: readonly Collection[], failed: Collection, cause: unknown) {
    super(
      `A write spanning collections saved ${written.join(', ')} but not ${failed}. ` +
        'Check those records before trying again.',
      { cause },
    );
  }
}

/**
 * `RecordStore` on Netlify Blobs: the records of each collection in one JSON
 * blob (`{ns}/records/{collection}.json`), so the site needs no account
 * beyond the Netlify one it is hosted on.
 *
 * - **Reads** load the collection's blob (strongly consistent) and answer
 *   with the in-memory store, so the contract holds by construction, as in
 *   local mode (`file-store.ts`). The club's collections are small — tens of
 *   events, a few hundred photos — so one read per call is cheap.
 * - **Writes** are a compare-and-swap on the blob's etag
 *   (`compareAndSwap`): read, run the memory store's checks and changes, write
 *   only if the blob is unchanged, otherwise start over. Every check and
 *   change of a write therefore lands together or not at all, and two admins
 *   (or two serverless instances) saving at once both land.
 * - **A batch is atomic within one collection.** Every write the app makes
 *   touches one collection (each repository writes its own, `entity.ts`).
 *   A batch spanning collections is checked against all of them first, so a
 *   failed check writes nothing; it is then written collection by collection,
 *   and if a later collection cannot be written, `PartialWriteError` says
 *   which ones were saved.
 * - **Rate-limit counters** (`hit`) are small blobs of their own
 *   (`{ns}/counters/{sha256(key)}`), updated the same way, so a burst on the
 *   contact form never contends with an admin's save. Blobs do not expire: a
 *   counter past its window starts again at 1.
 */
export function createBlobsStore({
  blobs,
  namespace,
}: {
  /** Called on first use, so nothing connects (or throws) at import. */
  blobs: () => RecordBlobs;
  namespace: string;
}): RecordStore {
  const keys = blobKeys(namespace);
  const queue = createKeyedQueue();
  const parseCollection = parseWith(CollectionBlobSchema, 'collection');
  const parseCounter = parseWith(CounterBlobSchema, 'rate-limit counter');

  async function load(collection: Collection) {
    const stored = await blobs().getWithMetadata(keys.collection(collection), {
      type: 'json',
      consistency: 'strong',
    });
    const records = stored ? parseCollection(stored.data).records : {};
    return createMemoryStore({ [collection]: records } as StoreSnapshot);
  }

  /** Apply one collection's ops by compare-and-swap; checks run against the fresh blob. */
  function writeCollection(collection: Collection, ops: readonly WriteOp[]) {
    const key = keys.collection(collection);
    return queue(key, () =>
      compareAndSwap<CollectionBlob>(blobs(), key, parseCollection, async (current) => {
        const memory = createMemoryStore({ [collection]: current?.records ?? {} });
        await memory.write(ops); // A failed check throws WriteCheckError: nothing is written.
        return { records: memory.snapshot()[collection] ?? {} };
      }),
    );
  }

  return {
    get: async (collection, id) => (await load(collection)).get(collection, id),
    list: async (collection, options) => (await load(collection)).list(collection, options),
    count: async (collection) => (await load(collection)).count(collection),

    async write(ops) {
      assertDistinctRecords(ops);
      const groups = new Map<Collection, WriteOp[]>();
      for (const op of ops) groups.set(op.collection, [...(groups.get(op.collection) ?? []), op]);
      const ordered = [...groups].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

      if (ordered.length > 1) {
        // Check the whole batch first, so a failed check writes nothing anywhere.
        const loaded = await Promise.all(ordered.map(([collection]) => load(collection)));
        const snapshot = Object.assign({}, ...loaded.map((store) => store.snapshot()));
        await createMemoryStore(snapshot as StoreSnapshot).write(ops);
      }

      const written: Collection[] = [];
      for (const [collection, group] of ordered) {
        try {
          await writeCollection(collection, group);
        } catch (error) {
          if (written.length > 0) throw new PartialWriteError(written, collection, error);
          throw error;
        }
        written.push(collection);
      }
    },

    async hit(key, windowSeconds) {
      const blobKey = keys.counter(createHash('sha256').update(key).digest('hex'));
      const counter = await queue(blobKey, () =>
        compareAndSwap(blobs(), blobKey, parseCounter, (current) => {
          const now = Date.now();
          return current && current.expiresAt > now
            ? { hits: current.hits + 1, expiresAt: current.expiresAt }
            : { hits: 1, expiresAt: now + windowSeconds * 1000 };
        }),
      );
      return counter.hits;
    },
  };
}
