import type * as VercelBlob from '@vercel/blob';
import { describe, expect, it, vi } from 'vitest';

import { createBlobsStorage } from '@/lib/data/adapters/blobs-storage';
import { createBlobsStore } from '@/lib/data/adapters/blobs-store';
import { vercelMediaBlobs, vercelRecordBlobs } from '@/lib/data/adapters/vercel-blob';
import type { WriteOp } from '@/lib/data/adapters/types';
import { LOCAL_MEDIA_PATH } from '@/lib/schemas/fields';

import { hostedStorageContract } from './hosted-storage-contract';
import { storeContract } from './store-contract';

/**
 * The Vercel Blob backend (D-040): the Netlify Blobs adapters over
 * `vercel-blob.ts`, run against an in-memory stand-in for `@vercel/blob` with
 * the behaviours the translation relies on — `ifMatch` compare-and-swap, a
 * create that refuses an existing pathname, `head` throwing when missing, and
 * paged listing.
 */

const fake = vi.hoisted(() => {
  type Stored = { bytes: Uint8Array; contentType: string; etag: string; uploadedAt: Date };
  const blobs = new Map<string, Stored>();
  let version = 0;
  return { blobs, nextEtag: () => `"etag-${++version}"`, pageSize: 2 };
});

vi.mock('@vercel/blob', async (importOriginal) => {
  const actual = await importOriginal<typeof VercelBlob>();
  const details = (
    pathname: string,
    blob: { bytes: Uint8Array; contentType: string; etag: string; uploadedAt: Date },
  ) => ({
    url: `https://store.private.blob.vercel-storage.com/${pathname}`,
    downloadUrl: `https://store.private.blob.vercel-storage.com/${pathname}?download=1`,
    pathname,
    contentType: blob.contentType,
    contentDisposition: '',
    cacheControl: '',
    size: blob.bytes.byteLength,
    uploadedAt: blob.uploadedAt,
    etag: blob.etag,
  });
  return {
    ...actual,
    put: vi.fn(
      async (
        pathname: string,
        body: Uint8Array,
        options: { contentType: string; allowOverwrite?: boolean; ifMatch?: string },
      ) => {
        const existing = fake.blobs.get(pathname);
        if (options.ifMatch !== undefined) {
          if (!existing || existing.etag !== options.ifMatch) {
            throw new actual.BlobPreconditionFailedError();
          }
        } else if (existing && !options.allowOverwrite) {
          throw new actual.BlobError('This blob already exists, use `allowOverwrite: true`');
        }
        const stored = {
          bytes: new Uint8Array(body),
          contentType: options.contentType,
          etag: fake.nextEtag(),
          uploadedAt: new Date(),
        };
        fake.blobs.set(pathname, stored);
        return details(pathname, stored);
      },
    ),
    get: vi.fn(async (pathname: string) => {
      const stored = fake.blobs.get(pathname);
      if (!stored) return null;
      return {
        statusCode: 200,
        stream: new Response(stored.bytes.slice()).body,
        headers: new Headers(),
        blob: details(pathname, stored),
      };
    }),
    head: vi.fn(async (pathname: string) => {
      const stored = fake.blobs.get(pathname);
      if (!stored) throw new actual.BlobNotFoundError();
      return details(pathname, stored);
    }),
    del: vi.fn(async (pathnames: string | string[]) => {
      for (const pathname of [pathnames].flat()) fake.blobs.delete(pathname);
    }),
    list: vi.fn(async ({ prefix, cursor }: { prefix: string; cursor?: string }) => {
      const all = [...fake.blobs.keys()].filter((key) => key.startsWith(prefix)).sort();
      const start = Number(cursor ?? 0);
      const page = all.slice(start, start + fake.pageSize);
      const hasMore = start + fake.pageSize < all.length;
      return {
        blobs: page.map((pathname) => details(pathname, fake.blobs.get(pathname)!)),
        cursor: hasMore ? String(start + fake.pageSize) : undefined,
        hasMore,
      };
    }),
  };
});

const NS = 'test';
const SECRET = 's'.repeat(32);
const records = () => vercelRecordBlobs('sig-records', { token: 'test-token' });
const media = () => vercelMediaBlobs('sig-media', { token: 'test-token' });

storeContract('vercel-blob', async () => {
  fake.blobs.clear();
  return { store: createBlobsStore({ blobs: records, namespace: NS }) };
});

hostedStorageContract('vercel-blob', async () => {
  fake.blobs.clear();
  return {
    storage: createBlobsStorage({ blobs: media, routePath: LOCAL_MEDIA_PATH, secret: SECRET }),
  };
});

const create = (id: string): WriteOp => ({
  kind: 'create',
  collection: 'gallery',
  id,
  data: JSON.stringify({ id }),
  version: 'v1',
  score: 1,
});

describe('Vercel Blob translation', () => {
  it('answers a stale etag and an existing pathname with "not modified"', async () => {
    fake.blobs.clear();
    const blobs = records();
    expect(await blobs.setJSON('a.json', { n: 1 }, { onlyIfNew: true })).toMatchObject({
      modified: true,
    });
    expect(await blobs.setJSON('a.json', { n: 2 }, { onlyIfNew: true })).toEqual({
      modified: false,
    });
    expect(await blobs.setJSON('a.json', { n: 2 }, { onlyIfMatch: '"stale"' })).toEqual({
      modified: false,
    });
    const current = await blobs.getWithMetadata('a.json', { type: 'json' });
    expect(current?.data).toEqual({ n: 1 });
    expect(await blobs.setJSON('a.json', { n: 3 }, { onlyIfMatch: current!.etag! })).toMatchObject({
      modified: true,
    });
    expect((await blobs.getWithMetadata('a.json', { type: 'json' }))?.data).toEqual({ n: 3 });
  });

  it('keeps each logical store under its own prefix', async () => {
    fake.blobs.clear();
    await records().setJSON('x.json', {});
    await media().set('x.webp', new ArrayBuffer(3), { metadata: { contentType: 'image/webp' } });
    expect([...fake.blobs.keys()].sort()).toEqual(['sig-media/x.webp', 'sig-records/x.json']);
  });

  it('lists every page, with keys relative to the store', async () => {
    fake.blobs.clear();
    for (const name of ['a', 'b', 'c', 'd', 'e']) {
      await media().set(`ns/${name}.webp`, new ArrayBuffer(1), {
        metadata: { contentType: 'image/webp' },
      });
    }
    const keys: string[] = [];
    for await (const page of media().list({ prefix: 'ns/', paginate: true })) {
      keys.push(...page.blobs.map((blob) => blob.key));
    }
    expect(keys).toEqual(['ns/a.webp', 'ns/b.webp', 'ns/c.webp', 'ns/d.webp', 'ns/e.webp']);
  });

  it('reads type, size and date from the store for the media adapter', async () => {
    fake.blobs.clear();
    await media().set('f.webp', new ArrayBuffer(7), { metadata: { contentType: 'image/webp' } });
    const found = await media().getMetadata('f.webp');
    expect(found?.metadata).toMatchObject({ contentType: 'image/webp', size: 7 });
    expect(typeof found?.metadata.uploadedAt).toBe('string');
    expect(await media().getMetadata('missing.webp')).toBeNull();
  });

  it('lands parallel writes to one collection, none lost', async () => {
    fake.blobs.clear();
    const store = createBlobsStore({ blobs: records, namespace: NS });
    await Promise.all(['p1', 'p2', 'p3', 'p4', 'p5'].map((id) => store.write([create(id)])));
    expect(await store.count('gallery')).toBe(5);
  });
});
