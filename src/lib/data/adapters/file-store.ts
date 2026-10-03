import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { createMemoryStore, type StoreSnapshot } from './memory-store';
import type { RecordStore } from './types';

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
  const load = (): StoreSnapshot =>
    existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as StoreSnapshot) : {};

  // Writes run one after another: each must read the file the previous one
  // wrote, or parallel saves (a batch of gallery photos) would lose records.
  let queue: Promise<unknown> = Promise.resolve();

  async function write(ops: Parameters<RecordStore['write']>[0]) {
    const store = createMemoryStore(load());
    await store.write(ops);
    mkdirSync(dirname(file), { recursive: true });
    const temporary = `${file}.${process.pid}.tmp`;
    writeFileSync(temporary, JSON.stringify(store.snapshot(), null, 1));
    renameSync(temporary, file);
  }

  return {
    get: (collection, id) => createMemoryStore(load()).get(collection, id),
    list: (collection, options) => createMemoryStore(load()).list(collection, options),
    count: (collection) => createMemoryStore(load()).count(collection),
    write(ops) {
      const next = queue.then(() => write(ops));
      queue = next.catch(() => undefined);
      return next;
    },
  };
}
