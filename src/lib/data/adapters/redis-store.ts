import { Redis } from '@upstash/redis';

import { type Collection, redisKeys } from '../keys';

import {
  assertDistinctRecords,
  type ListOptions,
  type RecordStore,
  WriteCheckError,
  type WriteOp,
} from './types';

/**
 * The atomic write. Redis runs a script without interleaving any other
 * command, so "check every version, then apply every change" cannot race
 * another admin's save — something MULTI alone cannot give over Upstash's REST
 * API, which has no WATCH. Indexes are updated in the same step, so a record
 * and its index entry can never drift apart.
 *
 * KEYS: for op i, KEYS[2i-1] is the record hash, KEYS[2i] the collection index.
 * ARGV: for op i, six values from ARGV[6(i-1)+1]: kind, id, data, version,
 *       expected version ('' = no check), score.
 * Returns {'ok', 0} or {reason, i} for the first failing check.
 */
const WRITE_SCRIPT = `
local n = #KEYS / 2
for i = 1, n do
  local a = (i - 1) * 6
  local current = redis.call('HGET', KEYS[2 * i - 1], 'version')
  if ARGV[a + 1] == 'create' then
    if current then return {'exists', i} end
  else
    if not current then return {'missing', i} end
    if ARGV[a + 5] ~= '' and current ~= ARGV[a + 5] then return {'conflict', i} end
  end
end
for i = 1, n do
  local a = (i - 1) * 6
  if ARGV[a + 1] == 'remove' then
    redis.call('DEL', KEYS[2 * i - 1])
    redis.call('ZREM', KEYS[2 * i], ARGV[a + 2])
  else
    redis.call('HSET', KEYS[2 * i - 1], 'data', ARGV[a + 3], 'version', ARGV[a + 4])
    redis.call('ZADD', KEYS[2 * i], ARGV[a + 6], ARGV[a + 2])
  end
end
return {'ok', 0}
`;

/** Count a hit; the first hit of a window sets its expiry. KEYS[1] counter, ARGV[1] seconds. */
const HIT_SCRIPT = `
local hits = redis.call('INCR', KEYS[1])
if hits == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return hits
`;

export type RedisStoreConfig = { url: string; token: string; namespace: string };

/** The production `RecordStore`: Upstash Redis over its REST API. */
export function createRedisStore({ url, token, namespace }: RedisStoreConfig) {
  // Raw strings in and out: the repository parses and validates every record.
  const redis = new Redis({ url, token, automaticDeserialization: false });
  const keys = redisKeys(namespace);
  const writeScript = redis.createScript<[string, number]>(WRITE_SCRIPT);
  const hitScript = redis.createScript<number>(HIT_SCRIPT);

  const store: RecordStore = {
    async get(collection, id) {
      return (await redis.hget<string>(keys.record(collection, id), 'data')) ?? null;
    },

    async list(collection: Collection, { order = 'asc', offset = 0, limit }: ListOptions = {}) {
      if (limit === 0) return [];
      const stop = limit === undefined ? -1 : offset + limit - 1;
      const ids = await redis.zrange<string[]>(keys.index(collection), offset, stop, {
        rev: order === 'desc',
      });
      if (ids.length === 0) return [];
      const pipeline = redis.pipeline();
      for (const id of ids) pipeline.hget(keys.record(collection, id), 'data');
      const data = await pipeline.exec<(string | null)[]>();
      return ids.map((id, index) => ({ id, data: data[index] ?? null }));
    },

    async count(collection) {
      return redis.zcard(keys.index(collection));
    },

    async write(ops: readonly WriteOp[]) {
      if (ops.length === 0) return;
      assertDistinctRecords(ops);
      const scriptKeys = ops.flatMap((op) => [
        keys.record(op.collection, op.id),
        keys.index(op.collection),
      ]);
      const args = ops.flatMap((op) =>
        op.kind === 'remove'
          ? ['remove', op.id, '', '', op.expectedVersion ?? '', '0']
          : [
              op.kind,
              op.id,
              op.data,
              op.version,
              op.kind === 'replace' ? (op.expectedVersion ?? '') : '',
              String(op.score),
            ],
      );
      const [result, index] = await writeScript.exec(scriptKeys, args);
      if (result === 'ok') return;
      if (result === 'exists' || result === 'missing' || result === 'conflict') {
        throw new WriteCheckError(result, ops[Number(index) - 1]!);
      }
      throw new Error(`Unexpected reply from the write script: ${String(result)}`);
    },

    async hit(key, windowSeconds) {
      // INCR and EXPIRE in one script, so a counter can never be left without its expiry.
      return Number(
        await hitScript.exec(
          [keys.rateLimit(key)],
          [String(Math.max(1, Math.ceil(windowSeconds)))],
        ),
      );
    },
  };

  async function scanKeys(): Promise<string[]> {
    const found: string[] = [];
    let cursor = '0';
    do {
      const [next, batch] = await redis.scan(cursor, { match: keys.pattern, count: 500 });
      found.push(...batch);
      cursor = String(next);
    } while (cursor !== '0');
    return found;
  }

  return Object.assign(store, {
    /** Every key in this namespace. For maintenance and the live tests only. */
    scanKeys,
    /** Delete every key in a throwaway namespace (live tests). Refuses `prod`. */
    async dropNamespace(): Promise<void> {
      if (namespace === 'prod') throw new Error('Refusing to drop the production namespace');
      const found = await scanKeys();
      if (found.length > 0) await redis.del(...found);
    },
  });
}

export type RedisStore = ReturnType<typeof createRedisStore>;
