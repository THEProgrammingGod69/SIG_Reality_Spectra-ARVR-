import { beforeEach, describe, expect, it } from 'vitest';

import { BACKUPS_KEPT, ORPHAN_GRACE_HOURS } from '@/lib/data/maintenance';

import { ADMIN, createHarness, DAY, type Harness, MEDIA_ORIGIN, NAMESPACE } from './harness';

/**
 * The nightly job (D-034): backups, restore and the orphan sweep, on the same
 * repositories and storage logic the app runs.
 */

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const HOUR = 60 * 60 * 1000;
const keyOf = (url: string) => url.slice(`${MEDIA_ORIGIN}/`.length);

let h: Harness;
beforeEach(() => {
  // 20:00 UTC is already the next day in India: backups are dated in club time.
  h = createHarness('2026-10-01T20:00:00.000Z');
});

async function addPhoto(n: number) {
  return h.gallery.create(
    { id: id(n), image: await h.image('gallery-photo', id(n)), category: 'workshop' },
    ADMIN,
  );
}

describe('backup', () => {
  it('stores every collection in one file, dated in club time', async () => {
    await addPhoto(1);
    await h.team.create(
      { id: id(2), name: 'Asha Rao', position: 'President', tier: 'core' },
      ADMIN,
    );
    await h.recruitment.save({ open: true, formUrl: 'https://forms.gle/example' }, null, ADMIN);

    const result = await h.maintenance.backup();
    expect(result).toEqual({ date: '2026-10-02', records: 3, removed: [] });
    expect(await h.maintenance.listBackups()).toEqual(['2026-10-02']);

    const backup = await h.maintenance.readBackup('2026-10-02');
    expect(backup).toMatchObject({ format: 'sig-reality-spectra-backup', namespace: NAMESPACE });
    expect(backup?.collections.gallery).toHaveLength(1);
    expect(backup?.collections.member).toEqual([expect.objectContaining({ name: 'Asha Rao' })]);
    expect(backup?.collections.event).toEqual([]);
  });

  it(`keeps the newest ${BACKUPS_KEPT}`, async () => {
    for (let night = 0; night < BACKUPS_KEPT + 2; night += 1) {
      await h.maintenance.backup();
      h.tick(DAY);
    }
    const dates = await h.maintenance.listBackups();
    expect(dates).toHaveLength(BACKUPS_KEPT);
    expect(dates[0]).toBe('2026-11-02');
    expect(dates).not.toContain('2026-10-02');
  });

  it('refuses to read a file that is not one of its backups', async () => {
    await h.storage.put(`${NAMESPACE}/backups/2026-01-01.json`, '{"hello":1}', 'application/json');
    await expect(h.maintenance.readBackup('2026-01-01')).rejects.toThrow(/not a backup/);
    expect(await h.maintenance.readBackup('2025-01-01')).toBeNull();
  });
});

describe('restore', () => {
  it('puts deleted and changed records back exactly as they were', async () => {
    const photo = await addPhoto(1);
    const member = await h.team.create(
      { id: id(2), name: 'Asha Rao', position: 'President', tier: 'core' },
      ADMIN,
    );
    await h.maintenance.backup();

    h.tick(HOUR);
    await h.gallery.remove(photo.id, photo.updatedAt);
    await h.team.update(member.id, member.updatedAt, { name: 'Changed Later' }, ADMIN);

    const backup = (await h.maintenance.readBackup('2026-10-02'))!;
    const results = await h.maintenance.restore(backup);
    expect(results.gallery).toEqual({ restored: 1, invalid: 0 });
    expect(results.member).toEqual({ restored: 1, invalid: 0 });

    expect(await h.gallery.get(photo.id)).toEqual(photo);
    expect(await h.team.get(member.id)).toEqual(member);
    // The restored records are as editable as ever: their versions are their own.
    await h.team.update(member.id, member.updatedAt, { name: 'Edited Again' }, ADMIN);
  });

  it('skips a record that no longer validates, and leaves records the backup lacks', async () => {
    await addPhoto(1);
    const backup = (await h.maintenance.readBackup((await h.maintenance.backup()).date))!;
    const later = await addPhoto(3);

    const results = await h.maintenance.restore({
      ...backup,
      collections: {
        ...backup.collections,
        gallery: [...backup.collections.gallery!, { id: 'x' }],
      },
    });
    expect(results.gallery).toEqual({ restored: 1, invalid: 1 });
    expect(await h.gallery.get(later.id)).not.toBeNull();
  });
});

describe('orphan sweep', () => {
  it(`deletes unused uploads older than ${ORPHAN_GRACE_HOURS} hours, and nothing else`, async () => {
    const used = await addPhoto(1);
    const old = await h.upload('gallery-photo', id(2));
    h.tick((ORPHAN_GRACE_HOURS + 1) * HOUR);
    const fresh = await h.upload('gallery-photo', id(3));
    await h.maintenance.backup();

    const preview = await h.maintenance.sweep({ dryRun: true });
    expect(preview).toMatchObject({ deleted: [keyOf(old)], dryRun: true });
    expect(await h.media.listKeys()).toContain(keyOf(old));

    const report = await h.maintenance.sweep();
    expect(report).toEqual({
      files: 3,
      recent: [keyOf(fresh)],
      deleted: [keyOf(old)],
      dryRun: false,
    });
    const left = await h.media.listKeys();
    expect(left).toContain(keyOf(used.image.url));
    expect(left).toContain(keyOf(fresh));
    expect(left).not.toContain(keyOf(old));
    // Backups are never swept.
    expect(await h.maintenance.listBackups()).toHaveLength(1);
  });

  it('keeps a file whose record names it on another domain (the media moved)', async () => {
    const photo = await addPhoto(1);
    const raw = JSON.parse((await h.store.get('gallery', photo.id))!) as typeof photo;
    raw.image.url = raw.image.url.replace(MEDIA_ORIGIN, 'https://media.new-domain.example');
    h.store.corrupt('gallery', photo.id, JSON.stringify(raw));
    h.tick(DAY * 2);

    expect((await h.maintenance.sweep()).deleted).toEqual([]);
  });

  it('refuses to delete most of the files at once: that is a misconfiguration', async () => {
    await addPhoto(1);
    for (let n = 10; n < 22; n += 1) await h.upload('gallery-photo', id(n));
    h.tick(DAY * 2);

    await expect(h.maintenance.sweep()).rejects.toThrow(/configuration mistake/);
    expect(await h.media.listKeys()).toHaveLength(13);
  });
});
