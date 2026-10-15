import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { getStore } from '@netlify/blobs';
import { BlobsServer } from '@netlify/blobs/server';
import { afterAll, describe, expect, it } from 'vitest';

import { createBlobsStorage } from '@/lib/data/adapters/blobs-storage';
import { createBlobsStore, PartialWriteError } from '@/lib/data/adapters/blobs-store';
import { blobsFetch } from '@/lib/data/adapters/netlify-blobs';
import { WriteCheckError, type WriteOp } from '@/lib/data/adapters/types';
import { blobKeys } from '@/lib/data/keys';
import { LOCAL_MEDIA_PATH } from '@/lib/schemas/fields';

import { createFakeBlobs, type FakeBlobs } from './fake-blobs';
import { hostedStorageContract } from './hosted-storage-contract';
import { storeContract } from './store-contract';

/**
 * The Netlify Blobs backend. The contracts and the concurrency tests run on
 * an in-memory fake of the Blobs service (`fake-blobs.ts`) with atomic
 * conditional writes and real etags; the SDK's own local server cannot
 * stand in for those (it returns no etag on reads and checks conditions
 * non-atomically). A short suite against that server checks what it can:
 * metadata, binary bodies and listing through the real SDK.
 */

const NS = 'test';
const SECRET = 's'.repeat(32);
const keys = blobKeys(NS);

const storeOn = (fake: FakeBlobs, namespace = NS) =>
  createBlobsStore({ blobs: () => fake, namespace });

const create = (id: string, collection: WriteOp['collection'] = 'gallery'): WriteOp => ({
  kind: 'create',
  collection,
  id,
  data: JSON.stringify({ id }),
  version: 'v1',
  score: 1,
});

storeContract('netlify-blobs', async () => ({ store: storeOn(createFakeBlobs()) }));

hostedStorageContract('netlify-blobs', async () => {
  const fake = createFakeBlobs();
  return {
    storage: createBlobsStorage({ blobs: () => fake, routePath: LOCAL_MEDIA_PATH, secret: SECRET }),
  };
});

describe('Netlify Blobs record store', () => {
  it('connects on first use, never when it is created', async () => {
    const store = createBlobsStore({
      blobs: () => {
        throw new Error('MissingBlobsEnvironmentError');
      },
      namespace: NS,
    });
    await expect(store.count('event')).rejects.toThrow(/MissingBlobsEnvironmentError/);
  });

  it('keeps each collection in its own blob, per namespace', async () => {
    const fake = createFakeBlobs();
    await storeOn(fake).write([create('a', 'event'), create('b', 'gallery')]);
    await storeOn(fake, 'other').write([create('c', 'event')]);
    expect(fake.keys()).toEqual([
      'other/records/event.json',
      keys.collection('event'),
      keys.collection('gallery'),
    ]);
    expect(await storeOn(fake).count('event')).toBe(1);
    expect(await storeOn(fake, 'other').get('event', 'a')).toBeNull();
  });

  it('lands every one of many parallel writes from one instance', async () => {
    const store = storeOn(createFakeBlobs());
    await Promise.all(Array.from({ length: 20 }, (_, index) => store.write([create(`p${index}`)])));
    expect(await store.count('gallery')).toBe(20);
  });

  it('lands every write when several instances save at once', async () => {
    // Separate stores share nothing in memory, like separate serverless instances.
    const fake = createFakeBlobs();
    const instances = Array.from({ length: 4 }, () => storeOn(fake));
    await Promise.all(
      Array.from({ length: 16 }, (_, index) =>
        instances[index % instances.length]!.write([create(`p${index}`)]),
      ),
    );
    expect(await storeOn(fake).count('gallery')).toBe(16);
  });

  it('retries on a stale etag, re-checking against what the other writer saved', async () => {
    const fake = createFakeBlobs();
    const store = storeOn(fake);
    await store.write([create('a')]);
    const key = keys.collection('gallery');
    // Another instance adds "b" between this write's read and its write.
    fake.interleave(key, () => {
      const blob = fake.readJSON(key) as { records: Record<string, unknown> };
      fake.writeJSON(key, {
        records: { ...blob.records, b: { data: '{"id":"b"}', version: 'v1', score: 2 } },
        writeId: 'someone-else',
      });
    });
    await store.write([create('c')]);
    expect((await store.list('gallery')).map((record) => record.id)).toEqual(['a', 'c', 'b']);
  });

  it('fails a check without retrying, against the latest data', async () => {
    const fake = createFakeBlobs();
    const store = storeOn(fake);
    await store.write([create('a')]);
    const before = fake.writes();
    const error = await store.write([create('a')]).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(WriteCheckError);
    expect(fake.writes()).toBe(before);
  });

  it('confirms a write the SDK could not report, by reading back its writeId', async () => {
    const fake = createFakeBlobs();
    const store = storeOn(fake);
    fake.faults.push('unconfirmed-stored');
    await store.write([create('a')]);
    expect(await store.get('gallery', 'a')).not.toBeNull();

    fake.faults.push('unconfirmed-lost');
    await expect(store.write([create('b')])).rejects.toThrow(/did not confirm/);
    expect(await store.get('gallery', 'b')).toBeNull();
  });

  it('counts a write that landed although the reply said it did not, once', async () => {
    // Without the writeId check, the retry would find "a" already there and fail.
    const fake = createFakeBlobs();
    const store = storeOn(fake);
    fake.faults.push('stored-then-412');
    await store.write([create('a')]);
    expect(await store.count('gallery')).toBe(1);
  });

  it('gives up after repeated contention with a clear message', async () => {
    const fake = createFakeBlobs();
    const store = storeOn(fake);
    await store.write([create('a')]);
    const key = keys.collection('gallery');
    let interfering = true;
    const interfere = (): void => {
      if (!interfering) return;
      fake.writeJSON(key, fake.readJSON(key));
      fake.interleave(key, interfere);
    };
    fake.interleave(key, interfere);
    await expect(store.write([create('b')])).rejects.toThrow(/Too many saves/);
    interfering = false;
  }, 20_000);

  it('applies a batch across collections only if every check holds', async () => {
    const fake = createFakeBlobs();
    const store = storeOn(fake);
    await store.write([create('a', 'gallery')]);
    await expect(store.write([create('x', 'event'), create('a', 'gallery')])).rejects.toThrow(
      WriteCheckError,
    );
    expect(await store.get('event', 'x')).toBeNull();
  });

  it('says which collections were saved when a later one cannot be', async () => {
    const fake = createFakeBlobs();
    const store = storeOn(fake);
    // Between the batch's checks and its gallery write, someone creates gallery "b".
    fake.interleave(keys.collection('gallery'), () => {
      fake.writeJSON(keys.collection('gallery'), {
        records: { b: { data: '{"id":"b"}', version: 'v1', score: 1 } },
        writeId: 'someone-else',
      });
    });
    const error = await store
      .write([create('a', 'event'), create('b', 'gallery')])
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(PartialWriteError);
    expect((error as Error).message).toMatch(/saved event but not gallery/);
  });

  it('refuses a blob that is not in its format instead of treating it as empty', async () => {
    const fake = createFakeBlobs();
    fake.writeJSON(keys.collection('event'), { records: 'nope' });
    const store = storeOn(fake);
    await expect(store.list('event')).rejects.toThrow(/not in the expected format/);
    await expect(store.write([create('a', 'event')])).rejects.toThrow(/not in the expected format/);
  });

  it('keeps rate-limit counters apart from records, under a hash of the key', async () => {
    const fake = createFakeBlobs();
    const store = storeOn(fake);
    expect(await store.hit('sender:someone@example.org', 3600)).toBe(1);
    expect(fake.keys()).toHaveLength(1);
    expect(fake.keys()[0]).toMatch(new RegExp(`^${NS}/counters/[0-9a-f]{64}$`));
    expect(fake.keys()[0]).not.toContain('someone');
  });

  it('counts every hit when several instances count at once', async () => {
    const fake = createFakeBlobs();
    const instances = [storeOn(fake), storeOn(fake)];
    const counts = await Promise.all(
      Array.from({ length: 10 }, (_, index) => instances[index % 2]!.hit('form:a', 60)),
    );
    expect([...counts].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});

describe('the fetch given to the SDK', () => {
  it('returns bodies the SDK can cancel, even when Next.js tees them', async () => {
    // As Next.js's patched fetch does: one branch of a tee, the other kept.
    const original = globalThis.fetch;
    let init: RequestInit | undefined;
    globalThis.fetch = (async (_input: RequestInfo | URL, given?: RequestInit) => {
      init = given;
      const [branch] = new Response('missing').body!.tee();
      return new Response(branch, { status: 404 });
    }) as typeof fetch;
    try {
      const response = await blobsFetch('https://blobs.example/key', { method: 'GET' });
      expect(response.status).toBe(404);
      expect(init?.cache).toBe('no-store');
      // Cancelling the tee branch itself would never settle.
      await expect(response.body?.cancel()).resolves.toBeUndefined();
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe('Netlify Blobs file storage', () => {
  it('keeps the type, size and upload time in metadata', async () => {
    const fake = createFakeBlobs();
    const storage = createBlobsStorage({
      blobs: () => fake,
      routePath: LOCAL_MEDIA_PATH,
      secret: SECRET,
    });
    const before = Date.now();
    await storage.put('dev/team/x/a.webp', new Uint8Array([1, 2, 3]), 'image/webp');
    const info = await storage.head('dev/team/x/a.webp');
    expect(info).toMatchObject({ size: 3, contentType: 'image/webp' });
    expect(info!.lastModified!.getTime()).toBeGreaterThanOrEqual(before - 1000);
  });

  it('reads a blob without metadata as empty and undated (never swept, refused on attach)', async () => {
    const fake = createFakeBlobs();
    fake.writeJSON('dev/team/x/a.webp', 'raw');
    const storage = createBlobsStorage({
      blobs: () => fake,
      routePath: LOCAL_MEDIA_PATH,
      secret: SECRET,
    });
    expect(await storage.head('dev/team/x/a.webp')).toEqual({
      size: 0,
      contentType: null,
      lastModified: null,
    });
  });
});

/* -------------------------------------------------------------------------- */
/* The SDK's local server: metadata, binary bodies and listing                */
/* -------------------------------------------------------------------------- */

const server = await startBlobsServer();

async function startBlobsServer() {
  // The environment's context would take priority over the options below.
  delete process.env.NETLIFY_BLOBS_CONTEXT;
  const directory = mkdtempSync(join(tmpdir(), 'sig-blobs-'));
  const token = 'local-test-token';
  try {
    const instance = new BlobsServer({ directory, token });
    const { port } = await instance.start();
    return { instance, directory, token, url: `http://localhost:${port}` };
  } catch (error) {
    console.warn('[test] The local Blobs server could not start; its suite is skipped.', error);
    rmSync(directory, { recursive: true, force: true });
    return null;
  }
}

describe.skipIf(server === null)('Netlify Blobs file storage on the SDK local server', () => {
  afterAll(async () => {
    await server?.instance.stop();
    if (server) rmSync(server.directory, { recursive: true, force: true });
  });

  const storage = () =>
    createBlobsStorage({
      blobs: () =>
        getStore({
          name: 'sig-media',
          siteID: 'local-test-site',
          token: server!.token,
          edgeURL: server!.url,
          uncachedEdgeURL: server!.url,
          consistency: 'strong',
        }),
      routePath: LOCAL_MEDIA_PATH,
      secret: SECRET,
    });

  it('stores binary bodies with their metadata, lists and deletes them', async () => {
    const files = storage();
    const body = new Uint8Array([0, 255, 1, 254, 128]);
    await files.put('dev/gallery/a/one.webp', body, 'image/webp');
    await files.put('dev/gallery/a/two.webp', body, 'image/webp');
    await files.put(
      'dev/recruitment/roles.pdf',
      new Uint8Array([37, 80, 68, 70]),
      'application/pdf',
    );

    expect(await files.get('dev/gallery/a/one.webp')).toEqual(body);
    expect(await files.head('dev/gallery/a/one.webp')).toMatchObject({
      size: 5,
      contentType: 'image/webp',
      lastModified: expect.any(Date),
    });
    expect(await files.list('dev/gallery/')).toEqual([
      'dev/gallery/a/one.webp',
      'dev/gallery/a/two.webp',
    ]);
    const served = await files.read('dev/recruitment/roles.pdf');
    expect(served?.contentType).toBe('application/pdf');
    expect(
      new Uint8Array(await new Response(served!.body as ReadableStream).arrayBuffer()),
    ).toEqual(new Uint8Array([37, 80, 68, 70]));

    await files.delete('dev/gallery/a/one.webp');
    expect(await files.head('dev/gallery/a/one.webp')).toBeNull();
    expect(await files.get('dev/gallery/a/one.webp')).toBeNull();
    expect(await files.read('dev/gallery/a/one.webp')).toBeNull();
    expect(await files.list('dev/')).toEqual([
      'dev/gallery/a/two.webp',
      'dev/recruitment/roles.pdf',
    ]);
  });
});
