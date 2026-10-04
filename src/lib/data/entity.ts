import type { z } from 'zod';

import type { SystemFields } from '@/lib/schemas/fields';
import type { MediaRef } from '@/lib/schemas/upload';

import {
  type ListOptions,
  type RecordStore,
  WriteCheckError,
  type WriteOp,
} from './adapters/types';
import { AlreadyExistsError, ConflictError, InvalidDataError, NotFoundError } from './errors';
import type { Collection } from './keys';
import type { MediaStore } from './media';
import type { CacheTag, Invalidate } from './tags';

/** What every repository is built from. Tests pass in-memory versions. */
export type RepositoryDeps = {
  store: RecordStore;
  media: MediaStore;
  /** Refresh cached public reads after a write (Next.js `updateTag` in the app). */
  invalidate: Invalidate;
  now: () => Date;
};

type EntityConfig<Fields, FieldsIn, Rec extends Fields & SystemFields> = {
  /** How messages name one record, e.g. "This event". */
  label: string;
  collection: Collection;
  /** The editable fields: what callers pass in. */
  input: z.ZodType<Fields, FieldsIn>;
  /** The stored record: the input plus system fields. */
  record: z.ZodType<Rec>;
  id: (fields: Fields) => string;
  /** Orders the collection's index. */
  score: (record: Rec) => number;
  /** The cache tags a change to this entity must refresh (rule 10). */
  tags: readonly CacheTag[];
  /** The uploaded files a record refers to. */
  files?: (fields: Fields) => MediaRef[];
  /** Rules that need more than the record itself: the current time, other data. */
  check?: (fields: Fields, context: { now: Date; previous: Rec | null }) => void;
};

export type RecordChange<FieldsIn> = {
  id: string;
  /** The `updatedAt` the admin's form was loaded with. */
  expectedUpdatedAt: string;
  changes: Partial<FieldsIn>;
};

/**
 * The generic repository every entity is built on, so the rules below exist
 * once instead of once per entity:
 *
 * - every write is validated against the entity's schema, and every read too —
 *   a record that no longer validates is logged and skipped, never allowed to
 *   break a public page;
 * - updates and deletes carry the `updatedAt` the admin started from, and fail
 *   with a "changed by someone else" error instead of overwriting;
 * - newly attached files are verified, and files a record stops using are
 *   deleted once the record is saved;
 * - every successful write refreshes the entity's cache tags.
 */
export function createEntity<Fields, FieldsIn, Rec extends Fields & SystemFields>(
  { store, media, invalidate, now }: RepositoryDeps,
  config: EntityConfig<Fields, FieldsIn, Rec>,
) {
  const files = (fields: Fields) => config.files?.(fields) ?? [];

  function parseStored(id: string, raw: string | null): Rec | null {
    if (raw === null) {
      console.error(`[data] ${config.collection} "${id}" is indexed but missing; skipped.`);
      return null;
    }
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      console.error(`[data] ${config.collection} "${id}" is not valid JSON; skipped.`);
      return null;
    }
    const result = config.record.safeParse(json);
    if (result.success) return result.data;
    const issues = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    console.error(`[data] ${config.collection} "${id}" failed validation; skipped.`, issues);
    return null;
  }

  function parseInput(value: unknown): Fields {
    const result = config.input.safeParse(value);
    if (result.success) return result.data;
    throw InvalidDataError.fromZod(result.error);
  }

  /** Validate, apply the extra rules, verify new files and stamp the record. */
  async function prepare(fields: Fields, previous: Rec | null, actor: string | null): Promise<Rec> {
    const at = now();
    config.check?.(fields, { now: at, previous });

    const previousUrls = new Set(previous ? files(previous).map((file) => file.url) : []);
    await Promise.all(
      files(fields)
        .filter((file) => !previousUrls.has(file.url))
        .map((file) => media.verify(file)),
    );

    const result = config.record.safeParse({
      ...fields,
      createdAt: previous?.createdAt ?? at.toISOString(),
      updatedAt: nextVersion(at, previous?.updatedAt ?? null),
      updatedBy: actor,
    });
    if (!result.success) throw InvalidDataError.fromZod(result.error);
    return result.data;
  }

  async function write(ops: readonly WriteOp[]): Promise<void> {
    try {
      await store.write(ops);
    } catch (error) {
      if (!(error instanceof WriteCheckError)) throw error;
      if (error.reason === 'exists') throw new AlreadyExistsError(config.label);
      if (error.reason === 'missing') throw new NotFoundError(config.label);
      throw new ConflictError(config.label);
    }
    invalidate(config.tags);
  }

  function upsertOp(record: Rec, expectedVersion: string | null): WriteOp {
    const base = {
      collection: config.collection,
      id: config.id(record),
      data: JSON.stringify(record),
      version: record.updatedAt,
      score: config.score(record),
    };
    return expectedVersion === null
      ? { kind: 'create', ...base }
      : { kind: 'replace', ...base, expectedVersion };
  }

  async function get(id: string): Promise<Rec | null> {
    const raw = await store.get(config.collection, id);
    // No record is an answer, not a fault; only an index pointing nowhere is.
    return raw === null ? null : parseStored(id, raw);
  }

  async function requireCurrent(id: string, expectedUpdatedAt: string): Promise<Rec> {
    const current = await get(id);
    if (current === null) throw new NotFoundError(config.label);
    // Fail fast with the friendly message; the store re-checks atomically.
    if (current.updatedAt !== expectedUpdatedAt) throw new ConflictError(config.label);
    return current;
  }

  async function updateMany(
    items: readonly RecordChange<FieldsIn>[],
    actor: string,
  ): Promise<Rec[]> {
    const previous = await Promise.all(
      items.map((item) => requireCurrent(item.id, item.expectedUpdatedAt)),
    );
    const next = await Promise.all(
      items.map(async (item, index) => {
        // A field set to `undefined` is "not changed", not "cleared" (that is `null`).
        const changes = Object.entries(item.changes).filter(([, value]) => value !== undefined);
        const fields = parseInput({ ...previous[index], ...Object.fromEntries(changes) });
        if (config.id(fields) !== item.id) {
          throw new InvalidDataError('A record id cannot be changed.', [
            { path: 'id', message: 'Cannot be changed' },
          ]);
        }
        return prepare(fields, previous[index]!, actor);
      }),
    );
    await write(next.map((record, index) => upsertOp(record, items[index]!.expectedUpdatedAt)));

    const kept = new Set(next.flatMap((record) => files(record).map((file) => file.url)));
    await media.remove(
      previous
        .flatMap((record) => files(record).map((file) => file.url))
        .filter((url) => !kept.has(url)),
    );
    return next;
  }

  return {
    get,

    /** Every valid record, in index order. */
    async list(options?: ListOptions): Promise<Rec[]> {
      const raw = await store.list(config.collection, options);
      return raw.map(({ id, data }) => parseStored(id, data)).filter((record) => record !== null);
    },

    count(): Promise<number> {
      return store.count(config.collection);
    },

    async create(input: FieldsIn, actor: string | null): Promise<Rec> {
      const record = await prepare(parseInput(input), null, actor);
      await write([upsertOp(record, null)]);
      return record;
    },

    /** Change some fields of one record. */
    async update(
      id: string,
      expectedUpdatedAt: string,
      changes: Partial<FieldsIn>,
      actor: string,
    ): Promise<Rec> {
      const [record] = await updateMany([{ id, expectedUpdatedAt, changes }], actor);
      return record!;
    },

    /** Change several records at once: all are saved, or none (e.g. a reorder). */
    updateMany,

    async remove(id: string, expectedUpdatedAt: string): Promise<void> {
      const current = await requireCurrent(id, expectedUpdatedAt);
      await write([
        { kind: 'remove', collection: config.collection, id, expectedVersion: expectedUpdatedAt },
      ]);
      await media.remove(files(current).map((file) => file.url));
    },

    /** What the nightly job and the restore script use (Stage 10, D-034). */
    maintenance: {
      collection: config.collection,

      /**
       * Every stored record as parsed JSON, valid or not: a backup keeps
       * everything, and the orphan sweep must not free a file that a record
       * which fails validation still names.
       */
      async exportAll(): Promise<unknown[]> {
        const raw = await store.list(config.collection);
        return raw.flatMap(({ id, data }) => {
          if (data === null) return [];
          try {
            return [JSON.parse(data) as unknown];
          } catch {
            console.error(`[data] ${config.collection} "${id}" is not valid JSON; not exported.`);
            return [];
          }
        });
      },

      /**
       * Put records from a backup back exactly as they were: their own dates,
       * versions and authors, no new file checks (each file was checked when
       * it was first attached). A record that fails validation is counted and
       * skipped; records missing from the backup are left alone.
       */
      async restore(records: readonly unknown[]): Promise<{ restored: number; invalid: number }> {
        const valid = records.flatMap((value) => {
          const parsed = config.record.safeParse(value);
          return parsed.success ? [parsed.data] : [];
        });
        const ops = await Promise.all(
          valid.map(async (record): Promise<WriteOp> => {
            const id = config.id(record);
            const op = {
              collection: config.collection,
              id,
              data: JSON.stringify(record),
              version: record.updatedAt,
              score: config.score(record),
            };
            return (await store.get(config.collection, id)) === null
              ? { kind: 'create', ...op }
              : { kind: 'replace', ...op, expectedVersion: null };
          }),
        );
        // In batches, so one request to the store never grows without bound.
        for (let start = 0; start < ops.length; start += RESTORE_BATCH) {
          await write(ops.slice(start, start + RESTORE_BATCH));
        }
        return { restored: valid.length, invalid: records.length - valid.length };
      },
    },
  };
}

/** Records written per atomic write when restoring a backup. */
const RESTORE_BATCH = 25;

/**
 * The new `updatedAt`: now, but always later than the previous one, so two
 * saves within the same millisecond still get different versions.
 */
function nextVersion(now: Date, previous: string | null): string {
  const floor = previous === null ? -Infinity : Date.parse(previous) + 1;
  return new Date(Math.max(now.getTime(), floor)).toISOString();
}

/** A record as public pages receive it: without the admin who last edited it. */
export function withoutAuthor<T extends { updatedBy: string | null }>({
  updatedBy: _updatedBy,
  ...rest
}: T): Omit<T, 'updatedBy'> {
  return rest;
}
