import type { Collection } from '../keys';

import {
  assertDistinctRecords,
  type ListOptions,
  type RawRecord,
  type RecordStore,
  WriteCheckError,
  type WriteOp,
} from './types';

type Entry = { data: string; version: string; score: number };

/** Every record, as plain JSON: what the local file store keeps on disk. */
export type StoreSnapshot = Partial<Record<Collection, Record<string, Entry>>>;

/**
 * An in-memory `RecordStore`: the reference implementation of the contract,
 * used by the unit tests and, loaded from a snapshot, by the local file store
 * (`file-store.ts`). Never the app's store on a server — each serverless
 * instance would have its own copy.
 */
export function createMemoryStore(initial: StoreSnapshot = {}) {
  const collections = new Map<Collection, Map<string, Entry>>(
    Object.entries(initial).map(([collection, records]) => [
      collection as Collection,
      new Map(Object.entries(records)),
    ]),
  );
  // Counters are not records: never part of a snapshot, gone when the process ends.
  const counters = new Map<string, { hits: number; expiresAt: number }>();
  const entries = (collection: Collection) => {
    let map = collections.get(collection);
    if (!map) collections.set(collection, (map = new Map()));
    return map;
  };

  const store: RecordStore = {
    async get(collection, id) {
      return entries(collection).get(id)?.data ?? null;
    },

    async list(collection, { order = 'asc', offset = 0, limit }: ListOptions = {}) {
      const sorted = [...entries(collection)].sort(
        ([idA, a], [idB, b]) => a.score - b.score || (idA < idB ? -1 : idA > idB ? 1 : 0),
      );
      if (order === 'desc') sorted.reverse();
      const page = sorted.slice(offset, limit === undefined ? undefined : offset + limit);
      return page.map(([id, entry]): RawRecord => ({ id, data: entry.data }));
    },

    async count(collection) {
      return entries(collection).size;
    },

    async write(ops: readonly WriteOp[]) {
      assertDistinctRecords(ops);
      for (const op of ops) {
        const current = entries(op.collection).get(op.id);
        if (op.kind === 'create') {
          if (current) throw new WriteCheckError('exists', op);
        } else if (!current) {
          throw new WriteCheckError('missing', op);
        } else if (op.expectedVersion !== null && current.version !== op.expectedVersion) {
          throw new WriteCheckError('conflict', op);
        }
      }
      for (const op of ops) {
        if (op.kind === 'remove') entries(op.collection).delete(op.id);
        else
          entries(op.collection).set(op.id, {
            data: op.data,
            version: op.version,
            score: op.score,
          });
      }
    },

    async hit(key, windowSeconds) {
      const now = Date.now();
      const current = counters.get(key);
      const counter =
        current && current.expiresAt > now
          ? { ...current, hits: current.hits + 1 }
          : { hits: 1, expiresAt: now + windowSeconds * 1000 };
      counters.set(key, counter);
      return counter.hits;
    },
  };

  return Object.assign(store, {
    /** Every record, as plain JSON. */
    snapshot(): StoreSnapshot {
      return Object.fromEntries(
        [...collections].map(([collection, map]) => [collection, Object.fromEntries(map)]),
      );
    },
    /** Test helper: overwrite a record's raw JSON, bypassing every check. */
    corrupt(collection: Collection, id: string, data: string) {
      const entry = entries(collection).get(id);
      entries(collection).set(id, {
        data,
        version: entry?.version ?? 'corrupt',
        score: entry?.score ?? 0,
      });
    },
    /** Test helper: the number of records across all collections. */
    size() {
      return [...collections.values()].reduce((total, map) => total + map.size, 0);
    },
  });
}

export type MemoryStore = ReturnType<typeof createMemoryStore>;
