import { z } from 'zod';

import { toClubLocalInput } from '@/lib/dates';

import type { ObjectStorage } from './adapters/types';
import { COLLECTIONS, type Collection, objectKey } from './keys';

/**
 * The nightly job and its counterpart, restore (Stage 10, D-034).
 *
 * - **Backup**: every record of every collection, as stored, into one JSON
 *   file in the file storage — `{ns}/backups/{yyyy-mm-dd}.json`, dated in club
 *   time — keeping the newest `BACKUPS_KEPT`. A second run on the same day
 *   replaces that day's file.
 * - **Orphan sweep**: deletes uploaded files no record mentions — replaced
 *   posters, removed photos, uploads never saved — once they are older than
 *   `ORPHAN_GRACE_HOURS`, so an admin's unsaved upload is never touched.
 * - **Restore**: puts a backup's records back exactly as they were.
 */

export const BACKUPS_KEPT = 30;
export const ORPHAN_GRACE_HOURS = 24;

/**
 * A sweep that would delete more than this share of all files — and more than
 * a handful — is refused: that is what pointing at an empty or wrong record
 * store looks like, not a night's worth of orphans.
 */
export const SWEEP_SAFETY = { maxShare: 0.5, minFiles: 10 } as const;

const BackupSchema = z.object({
  format: z.literal('sig-reality-spectra-backup'),
  version: z.literal(1),
  namespace: z.string(),
  createdAt: z.string(),
  collections: z.partialRecord(z.enum(COLLECTIONS), z.array(z.unknown())),
});

export type Backup = z.infer<typeof BackupSchema>;

/** What a repository offers the nightly job (`entity.maintenance`). */
type Maintainable = {
  maintenance: {
    collection: Collection;
    exportAll(): Promise<unknown[]>;
    restore(records: readonly unknown[]): Promise<{ restored: number; invalid: number }>;
  };
};

export type SweepReport = {
  /** Files in this namespace, backups excluded. */
  files: number;
  /** Unmentioned, but too recent to delete (an upload not saved yet). */
  recent: string[];
  deleted: string[];
  dryRun: boolean;
};

/** Every string anywhere inside a value: the URLs a record mentions, wherever they sit. */
function collectStrings(value: unknown, into: Set<string>): Set<string> {
  if (typeof value === 'string') into.add(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, into));
  else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectStrings(item, into));
  }
  return into;
}

export function createMaintenance({
  storage,
  namespace,
  repositories,
  now = () => new Date(),
}: {
  storage: ObjectStorage;
  namespace: string;
  repositories: readonly Maintainable[];
  now?: () => Date;
}) {
  const ownPrefix = objectKey(namespace, '');
  const backupsPrefix = objectKey(namespace, 'backups/');
  const backupKey = (date: string) => `${backupsPrefix}${date}.json`;

  /**
   * The storage key a stored URL points at, matched by its path from the
   * namespace on: an R2 URL on any domain, or a local-mode path. Matching by
   * key, not by whole URL, means moving the media to a new domain later can
   * never make every file look unused.
   */
  function keyIn(url: string): string | null {
    const at = url.indexOf(`/${ownPrefix}`);
    return at === -1 ? null : url.slice(at + 1).split(/[?#]/)[0]!;
  }

  async function exportAll(): Promise<Backup['collections']> {
    const entries = await Promise.all(
      repositories.map(
        async ({ maintenance }) => [maintenance.collection, await maintenance.exportAll()] as const,
      ),
    );
    return Object.fromEntries(entries);
  }

  /** Backup dates (yyyy-mm-dd), newest first. */
  async function listBackups(): Promise<string[]> {
    const keys = await storage.list(backupsPrefix);
    return keys
      .map((key) => key.slice(backupsPrefix.length).replace(/\.json$/, ''))
      .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
      .sort()
      .reverse();
  }

  return {
    listBackups,

    /** Write today's backup and drop the ones beyond `BACKUPS_KEPT`. */
    async backup(): Promise<{ date: string; records: number; removed: string[] }> {
      const at = now();
      const date = toClubLocalInput(at.toISOString()).slice(0, 10);
      const backup: Backup = {
        format: 'sig-reality-spectra-backup',
        version: 1,
        namespace,
        createdAt: at.toISOString(),
        collections: await exportAll(),
      };
      await storage.put(backupKey(date), JSON.stringify(backup), 'application/json');

      const removed = (await listBackups()).slice(BACKUPS_KEPT);
      await Promise.all(removed.map((old) => storage.delete(backupKey(old))));
      const records = Object.values(backup.collections).reduce(
        (total, list) => total + (list?.length ?? 0),
        0,
      );
      return { date, records, removed };
    },

    /** A stored backup, validated; null if there is none for that date. */
    async readBackup(date: string): Promise<Backup | null> {
      const body = await storage.get(backupKey(date));
      if (body === null) return null;
      const parsed = BackupSchema.safeParse(JSON.parse(new TextDecoder().decode(body)));
      if (!parsed.success)
        throw new Error(`The backup for ${date} is not a backup this site wrote.`);
      return parsed.data;
    },

    /** Put a backup's records back, collection by collection. */
    async restore(
      backup: Backup,
    ): Promise<Partial<Record<Collection, { restored: number; invalid: number }>>> {
      const results = await Promise.all(
        repositories.map(async ({ maintenance }) => {
          const records = backup.collections[maintenance.collection] ?? [];
          return [maintenance.collection, await maintenance.restore(records)] as const;
        }),
      );
      return Object.fromEntries(results);
    },

    /** Delete files no record mentions, once they are older than the grace period. */
    async sweep({ dryRun = false }: { dryRun?: boolean } = {}): Promise<SweepReport> {
      const mentioned = new Set<string>();
      for (const value of collectStrings(await exportAll(), new Set())) {
        const key = keyIn(value);
        if (key) mentioned.add(key);
      }
      const files = (await storage.list(ownPrefix)).filter((key) => !key.startsWith(backupsPrefix));
      const cutoff = now().getTime() - ORPHAN_GRACE_HOURS * 60 * 60 * 1000;

      const recent: string[] = [];
      const orphans: string[] = [];
      for (const key of files.filter((file) => !mentioned.has(file))) {
        const stored = (await storage.head(key))?.lastModified;
        // An unknown age is treated as recent: never delete what cannot be dated.
        if (!stored || stored.getTime() > cutoff) recent.push(key);
        else orphans.push(key);
      }

      if (
        orphans.length >= SWEEP_SAFETY.minFiles &&
        orphans.length > files.length * SWEEP_SAFETY.maxShare
      ) {
        throw new Error(
          `The sweep would delete ${orphans.length} of ${files.length} files, which looks like ` +
            'a configuration mistake (an empty or wrong data store), so nothing was deleted.',
        );
      }
      if (!dryRun) await Promise.all(orphans.map((key) => storage.delete(key)));
      return { files: files.length, recent, deleted: orphans, dryRun };
    },
  };
}

export type Maintenance = ReturnType<typeof createMaintenance>;
