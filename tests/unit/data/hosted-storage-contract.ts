import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { HOSTED_UPLOAD_PART_BYTES, type HostedStorage } from '@/lib/data/adapters/hosted-uploads';
import { createMaintenance, ORPHAN_GRACE_HOURS } from '@/lib/data/maintenance';
import { createMedia } from '@/lib/data/media';
import { LOCAL_MEDIA_PATH } from '@/lib/schemas/fields';

/**
 * Storage the site hosts itself (local data mode's folder, Netlify Blobs):
 * what the `/api/local-media` route relies on. Each backend runs this suite
 * with its own setup, as the record stores run `storeContract`.
 */
export function hostedStorageContract(
  name: string,
  setup: () => Promise<{ storage: HostedStorage; cleanup?: () => Promise<void> }>,
) {
  describe(`hosted storage contract: ${name}`, () => {
    let storage: HostedStorage;
    let cleanup: (() => Promise<void>) | undefined;
    beforeEach(async () => {
      ({ storage, cleanup } = await setup());
    });
    afterEach(async () => {
      await cleanup?.();
    });

    const bytes = new Uint8Array([1, 2, 3, 4]);
    const KEY = 'dev/gallery/abc/photo.webp';
    const signed = async (key: string, ttl = 60) => {
      const url = new URL(await storage.presignPut(key, ttl), 'http://localhost');
      return {
        path: url.pathname,
        expires: url.searchParams.get('expires'),
        signature: url.searchParams.get('signature'),
      };
    };
    const text = async (body: Uint8Array | ReadableStream<Uint8Array>) =>
      new Uint8Array(
        await new Response(body instanceof Uint8Array ? body.slice() : body).arrayBuffer(),
      );

    it('accepts an upload to a URL it signed, and serves it back', async () => {
      const ticket = await signed(KEY);
      expect(ticket.path).toBe(`${LOCAL_MEDIA_PATH}/${KEY}`);

      expect(await storage.receive(KEY, ticket, bytes, 'image/webp')).toEqual({
        ok: true,
        complete: true,
      });
      expect(await storage.head(KEY)).toEqual({
        size: 4,
        contentType: 'image/webp',
        lastModified: expect.any(Date),
      });
      const file = await storage.read(KEY);
      expect(file?.contentType).toBe('image/webp');
      expect(await text(file!.body)).toEqual(bytes);
      expect(await storage.get(KEY)).toEqual(bytes);
      expect(await storage.get('dev/gallery/abc/missing.webp')).toBeNull();
      expect(await storage.head('dev/gallery/abc/missing.webp')).toBeNull();
      expect(await storage.read('dev/gallery/abc/missing.webp')).toBeNull();
      expect(await storage.list('dev/')).toEqual([KEY]);

      await storage.delete(KEY);
      await storage.delete(KEY); // A missing object is not an error.
      expect(await storage.head(KEY)).toBeNull();
      expect(await storage.list('')).toEqual([]);
    });

    it('lists by prefix, sorted', async () => {
      for (const key of ['dev/b.webp', 'dev/a.webp', 'dev/c/d.pdf', 'prod/a.webp', 'devx.webp']) {
        await storage.put(key, bytes, key.endsWith('.pdf') ? 'application/pdf' : 'image/webp');
      }
      expect(await storage.list('dev/')).toEqual(['dev/a.webp', 'dev/b.webp', 'dev/c/d.pdf']);
    });

    it('refuses a forged, reused-for-another-file or expired signature', async () => {
      const ticket = await signed(KEY);
      const forbidden = { ok: false, status: 403 };
      expect(
        await storage.receive(KEY, { ...ticket, signature: 'f'.repeat(64) }, bytes, 'image/webp'),
      ).toMatchObject(forbidden);
      expect(
        await storage.receive('dev/gallery/other/photo.webp', ticket, bytes, 'image/webp'),
      ).toMatchObject(forbidden);
      expect(await storage.receive(KEY, await signed(KEY, -1), bytes, 'image/webp')).toMatchObject(
        forbidden,
      );
      expect(
        await storage.receive(KEY, { expires: null, signature: null }, bytes, 'image/webp'),
      ).toMatchObject(forbidden);
      expect(await storage.list('')).toEqual([]);
    });

    it('refuses a body whose type is not the one its key was signed for', async () => {
      const ticket = await signed(KEY);
      for (const type of ['text/html', 'image/png', 'application/pdf', '', 'image/svg+xml']) {
        expect(await storage.receive(KEY, ticket, bytes, type)).toMatchObject({
          ok: false,
          status: 415,
        });
      }
      // A key that is not an upload's (here: a page) takes nothing, whatever the type.
      const page = 'dev/gallery/abc/page.html';
      expect(await storage.receive(page, await signed(page), bytes, 'text/html')).toMatchObject({
        ok: false,
        status: 415,
      });
      // A parameter on the right type is fine.
      expect(await storage.receive(KEY, ticket, bytes, 'image/webp; charset=binary')).toMatchObject(
        { ok: true },
      );
      expect((await storage.head(KEY))?.contentType).toBe('image/webp');
      expect(await storage.list('')).toEqual([KEY]);
    });

    it("refuses a body over its kind's size limit", async () => {
      const big = new Uint8Array(5 * 1024 * 1024 + 1);
      expect(await storage.receive(KEY, await signed(KEY), big, 'image/webp')).toMatchObject({
        ok: false,
        status: 413,
      });
      expect(await storage.list('')).toEqual([]);
    });

    it('assembles a file sent in parts, then deletes the parts', async () => {
      const key = 'dev/recruitment/roles.pdf';
      const ticket = await signed(key);
      const size = 2 * HOSTED_UPLOAD_PART_BYTES + 10;
      const file = new Uint8Array(size).map((_, index) => index % 251);
      const parts = 3;
      for (let part = 0; part < parts; part++) {
        const body = file.slice(
          part * HOSTED_UPLOAD_PART_BYTES,
          (part + 1) * HOSTED_UPLOAD_PART_BYTES,
        );
        const result = await storage.receive(
          key,
          { ...ticket, part: String(part), parts: String(parts) },
          body,
          'application/pdf',
        );
        expect(result).toEqual({ ok: true, complete: part === parts - 1 });
        if (part < parts - 1) expect(await storage.head(key)).toBeNull();
      }
      expect(await storage.head(key)).toMatchObject({ size, contentType: 'application/pdf' });
      // Compared as buffers: a deep equal over 8 MB of elements is very slow.
      expect(Buffer.from((await storage.get(key))!).equals(Buffer.from(file))).toBe(true);
      expect(await storage.list('')).toEqual([key]);
    });

    it('refuses to assemble an upload with a missing part', async () => {
      const key = 'dev/recruitment/roles.pdf';
      const ticket = await signed(key);
      const part = (index: number) => ({ ...ticket, part: String(index), parts: '3' });
      expect(await storage.receive(key, part(0), bytes, 'application/pdf')).toMatchObject({
        ok: true,
      });
      expect(await storage.receive(key, part(2), bytes, 'application/pdf')).toMatchObject({
        ok: false,
        status: 409,
      });
      expect(await storage.head(key)).toBeNull();
      // The part that did arrive waits for the orphan sweep.
      expect(await storage.list('')).toEqual([`${key}.part-0`]);
    });

    it('refuses nonsense part numbers and parts whose total is too large', async () => {
      const ticket = await signed(KEY);
      for (const [part, parts] of [
        ['3', '3'],
        ['-1', '3'],
        ['0', '0'],
        ['0', '999'],
        ['x', '2'],
      ] as const) {
        expect(
          await storage.receive(KEY, { ...ticket, part, parts }, bytes, 'image/webp'),
        ).toMatchObject({ ok: false, status: 400 });
      }
      const four = new Uint8Array(4 * 1024 * 1024);
      const upload = (index: number) =>
        storage.receive(KEY, { ...ticket, part: String(index), parts: '2' }, four, 'image/webp');
      expect(await upload(0)).toMatchObject({ ok: true });
      expect(await upload(1)).toMatchObject({ ok: false, status: 413 });
      expect(await storage.list('')).toEqual([]);
    });

    it('never serves a backup or an upload part', async () => {
      await storage.put('dev/backups/2026-10-01.json', '{"secret":true}', 'application/json');
      await storage.put(`${KEY}.part-0`, bytes, 'image/webp');
      // Even with a type that would be allowed, the key must be an upload's.
      await storage.put('dev/backups/2026-10-02.json', bytes, 'image/webp');
      // And a stored type must match the key.
      await storage.put('dev/gallery/abc/odd.webp', bytes, 'text/html');
      for (const key of [
        'dev/backups/2026-10-01.json',
        'dev/backups/2026-10-02.json',
        `${KEY}.part-0`,
        'dev/gallery/abc/odd.webp',
      ]) {
        expect(await storage.read(key)).toBeNull();
      }
    });

    it('lets the orphan sweep remove the parts of an abandoned upload', async () => {
      const key = 'dev/recruitment/roles.pdf';
      const ticket = await signed(key);
      await storage.receive(key, { ...ticket, part: '0', parts: '2' }, bytes, 'application/pdf');
      const later = new Date(Date.now() + (ORPHAN_GRACE_HOURS + 1) * 60 * 60 * 1000);
      const maintenance = createMaintenance({
        storage,
        namespace: 'dev',
        repositories: [],
        now: () => later,
      });
      expect((await maintenance.sweep()).deleted).toEqual([`${key}.part-0`]);
      expect(await storage.list('')).toEqual([]);
    });

    it('works with the media layer: upload tickets, attach checks, server-side files', async () => {
      const media = createMedia({
        storage,
        namespace: 'dev',
        publicBaseUrl: LOCAL_MEDIA_PATH,
        partBytes: HOSTED_UPLOAD_PART_BYTES,
      });
      const id = '66666666-6666-4666-8666-666666666666';
      const url = await media.putFile('gallery-photo', id, bytes, 'image/webp');

      expect(url.startsWith(`${LOCAL_MEDIA_PATH}/dev/gallery/${id}/`)).toBe(true);
      await expect(
        media.verify({ url, target: 'gallery-photo', recordId: id }),
      ).resolves.toBeUndefined();
      await expect(media.verify({ url, target: 'member-photo', recordId: id })).rejects.toThrow(
        /different record/,
      );

      const ticket = await media.createUpload({
        target: 'roles-pdf',
        contentType: 'application/pdf',
        size: 1000,
      });
      expect(ticket.partBytes).toBe(HOSTED_UPLOAD_PART_BYTES);
      const key = ticket.url.slice(`${LOCAL_MEDIA_PATH}/`.length);
      const query = new URL(ticket.uploadUrl, 'http://localhost').searchParams;
      expect(
        await storage.receive(
          key,
          { expires: query.get('expires'), signature: query.get('signature') },
          bytes,
          'application/pdf',
        ),
      ).toMatchObject({ ok: true });
      await expect(
        media.verify({ url: ticket.url, target: 'roles-pdf', recordId: null }),
      ).resolves.toBeUndefined();
    });
  });
}
