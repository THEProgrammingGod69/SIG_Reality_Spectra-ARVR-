import type {
  BlobMetadata,
  BlobWriteResult,
  MediaBlobs,
  RecordBlobs,
  WriteCondition,
} from '@/lib/data/adapters/netlify-blobs';

/**
 * An in-memory stand-in for the slice of a Netlify Blobs `Store` the adapters
 * use. Unlike the SDK's local `BlobsServer` (which returns no etag on reads
 * and checks conditions non-atomically), it behaves like the real service:
 * every write gets a fresh etag, reads are strongly consistent, and a
 * conditional write checks and applies in one step.
 *
 * Every call yields to the event loop first, so concurrent compare-and-swap
 * loops really interleave. `faults` make the next conditional write misbehave
 * the ways the SDK can.
 */

type Entry = { bytes: Uint8Array; metadata: BlobMetadata; etag: string };

export type Fault =
  /** Stored, but the SDK reports `{ modified: true, etag: '' }` (an error it swallowed). */
  | 'unconfirmed-stored'
  /** Not stored, and reported as `{ modified: true, etag: '' }`. */
  | 'unconfirmed-lost'
  /** Stored, but the reply was lost and the SDK's retry answered 412. */
  | 'stored-then-412';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

export function createFakeBlobs() {
  const entries = new Map<string, Entry>();
  let writes = 0;
  const faults: Fault[] = [];
  /** Run inside the next conditional write to their key, just before its check: another writer's change. */
  const interleaved = new Map<string, () => void>();

  const store = (key: string, bytes: Uint8Array, metadata: BlobMetadata = {}) => {
    const etag = `"etag-${++writes}"`;
    entries.set(key, { bytes, metadata, etag });
    return etag;
  };
  const json = (entry: Entry) => JSON.parse(new TextDecoder().decode(entry.bytes)) as unknown;

  const blobs = {
    async getWithMetadata(key: string, { type }: { type: 'json' | 'stream' }) {
      await tick();
      const entry = entries.get(key);
      if (!entry) return null;
      const data = type === 'json' ? json(entry) : new Blob([entry.bytes.slice()]).stream();
      return { data, etag: entry.etag, metadata: { ...entry.metadata } } as never;
    },

    async get(key: string, _options: { type: 'arrayBuffer' }) {
      await tick();
      const entry = entries.get(key);
      return entry ? entry.bytes.slice().buffer : null;
    },

    async getMetadata(key: string) {
      await tick();
      const entry = entries.get(key);
      return entry ? { etag: entry.etag, metadata: { ...entry.metadata } } : null;
    },

    async set(key: string, data: string | ArrayBuffer, { metadata }: { metadata: BlobMetadata }) {
      await tick();
      const bytes =
        typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data.slice(0));
      return { modified: true, etag: store(key, bytes, metadata) };
    },

    async setJSON(
      key: string,
      data: unknown,
      condition?: WriteCondition,
    ): Promise<BlobWriteResult> {
      await tick();
      const bytes = new TextEncoder().encode(JSON.stringify(data));
      if (!condition) return { modified: true, etag: store(key, bytes) };

      // Check and apply with no await in between: atomic, as on the service.
      const change = interleaved.get(key);
      interleaved.delete(key);
      change?.();
      const current = entries.get(key);
      const holds = 'onlyIfNew' in condition ? !current : current?.etag === condition.onlyIfMatch;
      if (!holds) return { modified: false };
      const fault = faults.shift();
      if (fault === 'unconfirmed-lost') return { modified: true, etag: '' };
      const etag = store(key, bytes);
      if (fault === 'unconfirmed-stored') return { modified: true, etag: '' };
      if (fault === 'stored-then-412') return { modified: false };
      return { modified: true, etag };
    },

    async delete(key: string) {
      await tick();
      entries.delete(key);
    },

    /** Two keys per page, so callers must follow the pagination. */
    list({ prefix }: { prefix: string; paginate: true }) {
      return (async function* () {
        await tick();
        const keys = [...entries.keys()].filter((key) => key.startsWith(prefix)).sort();
        for (let start = 0; start < keys.length; start += 2) {
          yield {
            blobs: keys
              .slice(start, start + 2)
              .map((key) => ({ key, etag: entries.get(key)!.etag })),
            directories: [],
          };
        }
      })();
    },
  };

  const typed: RecordBlobs & MediaBlobs = blobs;
  return Object.assign(typed, {
    /** Make the next conditional writes misbehave, in order. */
    faults,
    /** Change a blob behind the adapter's back, inside the next conditional write to `key`. */
    interleave(key: string, change: () => void) {
      interleaved.set(key, change);
    },
    /** Test helpers: a blob's JSON, written or read with no conditions. */
    readJSON: (key: string) => {
      const entry = entries.get(key);
      return entry ? json(entry) : null;
    },
    writeJSON: (key: string, data: unknown) =>
      void store(key, new TextEncoder().encode(JSON.stringify(data))),
    keys: () => [...entries.keys()].sort(),
    /** How many writes landed, conditional or not. */
    writes: () => writes,
  });
}

export type FakeBlobs = ReturnType<typeof createFakeBlobs>;
