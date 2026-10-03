import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { createMemoryStore, type MemoryStore, type StoreSnapshot } from './memory-store';
import type { RecordStore } from './types';

/** What every store on one file shares within this process. */
type FileState = {
  /** Writes run one after another (see below). */
  queue: Promise<unknown>;
  /** Rate-limit counters: kept in memory, cleared when the server restarts. */
  counters: MemoryStore;
};

/**
 * Per file, for the whole process. The development server can load this
 * module more than once (one copy per bundle), and two copies writing the same
 * file at once would each start from the old contents and one write would be
 * lost — so the queue cannot live in a module-level or per-store variable.
 */
const files: Map<string, FileState> = ((
  globalThis as { __sigFileStores?: Map<string, FileState> }
).__sigFileStores ??= new Map());

/**
 * Local data mode's `RecordStore` (D-031): every record in one JSON file under
 * `.data/`. Each call reads the file and runs the in-memory store's logic on
 * it, so both stores obey the same contract by construction; a write then
 * replaces the file atomically (write a temporary file, rename it over).
 *
 * For one developer's machine: two processes writing at the same moment could
 * lose one write, which is why it is refused on any deployed site.
 */
export function createFileStore(file: string): RecordStore {
  const path = resolve(file);
  let shared = files.get(path);
  if (!shared)
    files.set(path, (shared = { queue: Promise.resolve(), counters: createMemoryStore() }));
  const state = shared;

  const load = (): StoreSnapshot =>
    existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as StoreSnapshot) : {};

  // Each write must read the file the previous one wrote, or parallel saves
  // (a batch of gallery photos, two admins at once) would lose records.
  async function write(ops: Parameters<RecordStore['write']>[0]) {
    const store = createMemoryStore(load());
    await store.write(ops);
    mkdirSync(dirname(path), { recursive: true });
    const temporary = `${path}.${process.pid}.tmp`;
    writeFileSync(temporary, JSON.stringify(store.snapshot(), null, 1));
    renameSync(temporary, path);
  }

  return {
    get: (collection, id) => createMemoryStore(load()).get(collection, id),
    list: (collection, options) => createMemoryStore(load()).list(collection, options),
    count: (collection) => createMemoryStore(load()).count(collection),
    write(ops) {
      const next = state.queue.then(() => write(ops));
      state.queue = next.catch(() => undefined);
      return next;
    },
    hit: (key, windowSeconds) => state.counters.hit(key, windowSeconds),
  };
}
