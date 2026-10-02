import { describe, expect, it, vi } from 'vitest';

import { createMemoryStorage } from '@/lib/data/adapters/memory-storage';
import { InvalidDataError, MediaError } from '@/lib/data/errors';
import { createMedia, UPLOAD_URL_TTL_SECONDS } from '@/lib/data/media';

const ORIGIN = 'https://media.example.org';
const RECORD = '33333333-3333-4333-8333-333333333333';

function setup(namespace = 'prod') {
  const storage = createMemoryStorage();
  const now = () => new Date('2026-10-01T10:00:00.000Z');
  return { storage, media: createMedia({ storage, namespace, publicBaseUrl: ORIGIN, now }) };
}

describe('upload tickets', () => {
  it('presigns a short-lived PUT under the record, in this namespace', async () => {
    const { media } = setup();
    const ticket = await media.createUpload({
      target: 'event-photo',
      recordId: RECORD,
      contentType: 'image/webp',
      size: 200_000,
    });

    expect(ticket.url).toMatch(
      new RegExp(`^${ORIGIN}/prod/events/${RECORD}/photos/[0-9a-f-]{36}\\.webp$`),
    );
    expect(ticket.uploadUrl).toContain(`expires=${UPLOAD_URL_TTL_SECONDS}`);
    expect(ticket.headers).toEqual({ 'Content-Type': 'image/webp' });
    expect(ticket.expiresAt).toBe('2026-10-01T10:05:00.000Z');
  });

  it('files the roles PDF under recruitment/, with no record id', async () => {
    const { media } = setup();
    const ticket = await media.createUpload({
      target: 'roles-pdf',
      contentType: 'application/pdf',
      size: 1_000_000,
    });
    expect(ticket.url).toMatch(new RegExp(`^${ORIGIN}/prod/recruitment/[0-9a-f-]{36}\\.pdf$`));
  });

  it.each([
    ['no record id', { target: 'gallery-photo', contentType: 'image/webp', size: 10 }, 'recordId'],
    [
      'a record id for the PDF',
      { target: 'roles-pdf', recordId: RECORD, contentType: 'application/pdf', size: 10 },
      'recordId',
    ],
    [
      'a type the target does not take',
      { target: 'member-photo', recordId: RECORD, contentType: 'image/gif', size: 10 },
      'contentType',
    ],
    [
      'an oversized file',
      { target: 'member-photo', recordId: RECORD, contentType: 'image/png', size: 6 * 1024 * 1024 },
      'size',
    ],
    [
      'an unknown target',
      { target: 'avatar', recordId: RECORD, contentType: 'image/png', size: 1 },
      'target',
    ],
    ['not an object at all', 'please', ''],
  ])('refuses %s', async (_label, request, path) => {
    const { media } = setup();
    const error = await media.createUpload(request).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(InvalidDataError);
    expect((error as InvalidDataError).issues.map((issue) => issue.path)).toContain(path);
  });
});

describe('attach checks', () => {
  async function uploaded(namespace = 'prod', info = { size: 100, contentType: 'image/webp' }) {
    const { media, storage } = setup(namespace);
    const ticket = await media.createUpload({
      target: 'gallery-photo',
      recordId: RECORD,
      contentType: 'image/webp',
      size: 100,
    });
    storage.simulateUpload(ticket.url.slice(ORIGIN.length + 1), info);
    return { media, storage, url: ticket.url };
  }

  it('accepts a finished upload in the right place', async () => {
    const { media, url } = await uploaded();
    await expect(
      media.verify({ url, target: 'gallery-photo', recordId: RECORD }),
    ).resolves.toBeUndefined();
  });

  it('refuses another deployment’s file, even in the same bucket', async () => {
    const { url } = await uploaded('preview');
    const { media } = setup('prod');
    await expect(
      media.verify({ url, target: 'gallery-photo', recordId: RECORD }),
    ).rejects.toBeInstanceOf(MediaError);
  });

  it('refuses a path that climbs out of its folder', async () => {
    const { media } = setup();
    const url = `${ORIGIN}/prod/gallery/${RECORD}/../../team/x.webp`;
    await expect(media.verify({ url, target: 'gallery-photo', recordId: RECORD })).rejects.toThrow(
      /not uploaded through the admin panel/,
    );
  });

  it('deletes and refuses a file whose stored type does not match', async () => {
    const { media, storage, url } = await uploaded('prod', { size: 100, contentType: 'text/html' });
    await expect(media.verify({ url, target: 'gallery-photo', recordId: RECORD })).rejects.toThrow(
      /not an allowed file type/,
    );
    expect(await storage.list('')).toEqual([]);
  });

  it('deletes and refuses an empty file', async () => {
    const { media, url } = await uploaded('prod', { size: 0, contentType: 'image/webp' });
    await expect(media.verify({ url, target: 'gallery-photo', recordId: RECORD })).rejects.toThrow(
      /empty/,
    );
  });
});

describe('deletes', () => {
  it('ignores URLs that are not ours and logs failures without throwing', async () => {
    const { media, storage } = setup();
    const ticket = await media.createUpload({
      target: 'member-photo',
      recordId: RECORD,
      contentType: 'image/webp',
      size: 1,
    });
    storage.simulateUpload(ticket.url.slice(ORIGIN.length + 1), {
      size: 1,
      contentType: 'image/webp',
    });
    const failing = vi.spyOn(storage, 'delete').mockRejectedValueOnce(new Error('R2 is down'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    await media.remove([ticket.url, 'https://elsewhere.example.com/a.webp']);
    expect(failing).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('orphan sweep'), expect.any(Error));
  });
});
