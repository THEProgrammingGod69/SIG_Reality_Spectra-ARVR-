import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createFileStorage } from '@/lib/data/adapters/file-storage';
import { createFileStore } from '@/lib/data/adapters/file-store';
import { LOCAL_MEDIA_PATH } from '@/lib/schemas/fields';

import { hostedStorageContract } from './hosted-storage-contract';
import { storeContract } from './store-contract';

/** Local data mode (D-031): the same contracts as Upstash and R2, on disk. */

const temporary = () => mkdtempSync(join(tmpdir(), 'sig-local-'));

storeContract('local file', async () => {
  const dir = temporary();
  return {
    store: createFileStore(join(dir, 'records.json')),
    cleanup: async () => rmSync(dir, { recursive: true, force: true }),
  };
});

describe('local file store', () => {
  it('keeps every record when many writes run at once', async () => {
    const dir = temporary();
    const store = createFileStore(join(dir, 'records.json'));
    await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        store.write([
          {
            kind: 'create',
            collection: 'gallery',
            id: `p${index}`,
            data: '{}',
            version: 'v',
            score: index,
          },
        ]),
      ),
    );
    expect(await store.count('gallery')).toBe(20);
    rmSync(dir, { recursive: true, force: true });
  });

  it('loses nothing when two copies of the store write one file at once', async () => {
    // As when the development server loads the data layer once per bundle.
    const dir = temporary();
    const file = join(dir, 'records.json');
    const stores = [createFileStore(file), createFileStore(file)];
    await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        stores[index % 2]!.write([
          {
            kind: 'create',
            collection: 'sponsorship',
            id: `r${index}`,
            data: '{}',
            version: 'v',
            score: index,
          },
        ]),
      ),
    );
    expect(await stores[0]!.count('sponsorship')).toBe(20);
    rmSync(dir, { recursive: true, force: true });
  });

  it('survives a restart: a new store reads what the last one wrote', async () => {
    const dir = temporary();
    const file = join(dir, 'records.json');
    await createFileStore(file).write([
      { kind: 'create', collection: 'event', id: 'a', data: '{"x":1}', version: 'v', score: 1 },
    ]);
    expect(await createFileStore(file).get('event', 'a')).toBe('{"x":1}');
    rmSync(dir, { recursive: true, force: true });
  });
});

hostedStorageContract('local file', async () => {
  const dir = temporary();
  return {
    storage: createFileStorage({ root: dir, routePath: LOCAL_MEDIA_PATH, secret: 's'.repeat(32) }),
    cleanup: async () => rmSync(dir, { recursive: true, force: true }),
  };
});

describe('local file storage', () => {
  let dir: string;
  let storage: ReturnType<typeof createFileStorage>;
  beforeEach(() => {
    dir = temporary();
    storage = createFileStorage({ root: dir, routePath: LOCAL_MEDIA_PATH, secret: 's'.repeat(32) });
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('refuses a key that climbs out of its folder', async () => {
    await expect(storage.put('../outside.webp', new Uint8Array([1]), 'image/webp')).rejects.toThrow(
      /Invalid storage key/,
    );
  });
});
