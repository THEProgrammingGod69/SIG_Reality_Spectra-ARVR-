import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { type RecordStore, WriteCheckError, type WriteOp } from '@/lib/data/adapters/types';

/**
 * The `RecordStore` contract. Every adapter runs this same suite — the
 * in-memory store always, Upstash Redis in `pnpm test:live` — so a future
 * Postgres adapter has a ready-made definition of "correct".
 */
export function storeContract(
  name: string,
  setup: () => Promise<{ store: RecordStore; cleanup?: () => Promise<void> }>,
) {
  describe(`RecordStore contract: ${name}`, () => {
    let store: RecordStore;
    let cleanup: (() => Promise<void>) | undefined;

    beforeEach(async () => {
      ({ store, cleanup } = await setup());
    });
    afterEach(async () => {
      await cleanup?.();
    });

    const create = (id: string, score: number, version = 'v1'): WriteOp => ({
      kind: 'create',
      collection: 'event',
      id,
      data: JSON.stringify({ id, version }),
      version,
      score,
    });

    async function expectCheck(ops: WriteOp[], reason: WriteCheckError['reason']) {
      const error = await store.write(ops).catch((caught: unknown) => caught);
      expect(error).toBeInstanceOf(WriteCheckError);
      expect((error as WriteCheckError).reason).toBe(reason);
    }

    it('creates, reads and counts records', async () => {
      await store.write([create('a', 2), create('b', 1)]);

      expect(JSON.parse((await store.get('event', 'a'))!)).toEqual({ id: 'a', version: 'v1' });
      expect(await store.get('event', 'missing')).toBeNull();
      expect(await store.count('event')).toBe(2);
      expect(await store.count('gallery')).toBe(0);
    });

    it('lists by score, either way, a page at a time', async () => {
      await store.write([create('a', 3), create('b', 1), create('c', 2)]);

      const ids = async (options?: Parameters<RecordStore['list']>[1]) =>
        (await store.list('event', options)).map((record) => record.id);
      expect(await ids()).toEqual(['b', 'c', 'a']);
      expect(await ids({ order: 'desc' })).toEqual(['a', 'c', 'b']);
      expect(await ids({ offset: 1, limit: 1 })).toEqual(['c']);
      expect(await ids({ order: 'desc', offset: 2, limit: 5 })).toEqual(['b']);
      expect(await ids({ limit: 0 })).toEqual([]);
    });

    it('refuses to create a record that exists', async () => {
      await store.write([create('a', 1)]);
      await expectCheck([create('a', 1, 'v2')], 'exists');
    });

    it('replaces only from the expected version', async () => {
      await store.write([create('a', 1)]);
      const replace = (expectedVersion: string | null, version: string): WriteOp => ({
        kind: 'replace',
        collection: 'event',
        id: 'a',
        data: JSON.stringify({ version }),
        version,
        expectedVersion,
        score: 5,
      });

      await expectCheck([replace('stale', 'v2')], 'conflict');
      await store.write([replace('v1', 'v2')]);
      expect(JSON.parse((await store.get('event', 'a'))!)).toEqual({ version: 'v2' });
      await store.write([replace(null, 'v3')]);
      expect(JSON.parse((await store.get('event', 'a'))!)).toEqual({ version: 'v3' });
    });

    it('updates the index score on replace', async () => {
      await store.write([create('a', 1), create('b', 2)]);
      await store.write([
        {
          kind: 'replace',
          collection: 'event',
          id: 'a',
          data: '{}',
          version: 'v2',
          expectedVersion: 'v1',
          score: 3,
        },
      ]);
      expect((await store.list('event')).map((record) => record.id)).toEqual(['b', 'a']);
    });

    it('removes a record and its index entry together', async () => {
      await store.write([create('a', 1)]);
      await expectCheck(
        [{ kind: 'remove', collection: 'event', id: 'a', expectedVersion: 'stale' }],
        'conflict',
      );
      await store.write([{ kind: 'remove', collection: 'event', id: 'a', expectedVersion: 'v1' }]);

      expect(await store.get('event', 'a')).toBeNull();
      expect(await store.list('event')).toEqual([]);
      expect(await store.count('event')).toBe(0);
      await expectCheck(
        [{ kind: 'remove', collection: 'event', id: 'a', expectedVersion: null }],
        'missing',
      );
    });

    it('applies a batch atomically: one failed check writes nothing', async () => {
      await store.write([create('a', 1)]);
      await expectCheck(
        [
          create('b', 2),
          {
            kind: 'replace',
            collection: 'event',
            id: 'a',
            data: '{}',
            version: 'v2',
            expectedVersion: 'stale',
            score: 1,
          },
        ],
        'conflict',
      );

      expect(await store.get('event', 'b')).toBeNull();
      expect(await store.count('event')).toBe(1);
    });

    it('keeps collections apart', async () => {
      await store.write([create('a', 1), { ...create('a', 1), collection: 'gallery' }]);
      await store.write([
        { kind: 'remove', collection: 'gallery', id: 'a', expectedVersion: null },
      ]);
      expect(await store.get('event', 'a')).not.toBeNull();
    });

    it('rejects a batch that touches one record twice', async () => {
      await expect(store.write([create('a', 1), create('a', 2)])).rejects.toThrow(/twice/);
    });

    it('counts hits per key within a window, then starts again', async () => {
      expect(await store.hit('form:a', 1)).toBe(1);
      expect(await store.hit('form:a', 1)).toBe(2);
      expect(await store.hit('form:b', 1)).toBe(1);
      // Counters are not records.
      expect(await store.count('sponsorship')).toBe(0);

      await new Promise((resolve) => setTimeout(resolve, 1_500));
      expect(await store.hit('form:a', 1)).toBe(1);
    });
  });
}
