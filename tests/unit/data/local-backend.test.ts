import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createFileStorage } from '@/lib/data/adapters/file-storage';
import { createFileStore } from '@/lib/data/adapters/file-store';
import { createMedia } from '@/lib/data/media';
import { LOCAL_MEDIA_PATH } from '@/lib/schemas/fields';

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

describe('local file storage', () => {
  let dir: string;
  let storage: ReturnType<typeof createFileStorage>;
  beforeEach(() => {
    dir = temporary();
    storage = createFileStorage({ root: dir, routePath: LOCAL_MEDIA_PATH, secret: 's'.repeat(32) });
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  const bytes = new Uint8Array([1, 2, 3, 4]);
  const signed = async (key: string, ttl = 60) => {
    const url = new URL(await storage.presignPut(key, ttl), 'http://localhost');
    return {
      path: url.pathname,
      expires: url.searchParams.get('expires'),
      signature: url.searchParams.get('signature'),
    };
  };

  it('accepts an upload to a URL it signed, and serves it back', async () => {
    const key = 'dev/gallery/abc/photo.webp';
    const ticket = await signed(key);
    expect(ticket.path).toBe(`${LOCAL_MEDIA_PATH}/${key}`);

    expect(await storage.receive(key, ticket, bytes, 'image/webp')).toBe(true);
    expect(await storage.head(key)).toEqual({
      size: 4,
      contentType: 'image/webp',
      lastModified: expect.any(Date),
    });
    expect((await storage.read(key))?.contentType).toBe('image/webp');
    expect(await storage.get(key)).toEqual(bytes);
    expect(await storage.get('dev/gallery/abc/missing.webp')).toBeNull();
    expect(await storage.list('dev/')).toEqual([key]);

    await storage.delete(key);
    expect(await storage.head(key)).toBeNull();
    expect(await storage.list('')).toEqual([]);
  });

  it('refuses a forged, reused-for-another-file or expired signature', async () => {
    const key = 'dev/gallery/abc/photo.webp';
    const ticket = await signed(key);
    expect(
      await storage.receive(key, { ...ticket, signature: 'f'.repeat(64) }, bytes, 'image/webp'),
    ).toBe(false);
    expect(await storage.receive('dev/gallery/other/photo.webp', ticket, bytes, 'image/webp')).toBe(
      false,
    );
    const expired = await signed(key, -1);
    expect(await storage.receive(key, expired, bytes, 'image/webp')).toBe(false);
    expect(
      await storage.receive(key, { expires: null, signature: null }, bytes, 'image/webp'),
    ).toBe(false);
    expect(await storage.list('')).toEqual([]);
  });

  it('refuses a key that climbs out of its folder', async () => {
    await expect(storage.put('../outside.webp', bytes, 'image/webp')).rejects.toThrow(
      /Invalid storage key/,
    );
  });

  it('works with the media layer: upload tickets, attach checks, server-side files', async () => {
    const media = createMedia({ storage, namespace: 'dev', publicBaseUrl: LOCAL_MEDIA_PATH });
    const id = '66666666-6666-4666-8666-666666666666';
    const url = await media.putFile('gallery-photo', id, bytes, 'image/webp');

    expect(url.startsWith(`${LOCAL_MEDIA_PATH}/dev/gallery/${id}/`)).toBe(true);
    await expect(
      media.verify({ url, target: 'gallery-photo', recordId: id }),
    ).resolves.toBeUndefined();
    await expect(media.verify({ url, target: 'member-photo', recordId: id })).rejects.toThrow(
      /different record/,
    );
  });
});
