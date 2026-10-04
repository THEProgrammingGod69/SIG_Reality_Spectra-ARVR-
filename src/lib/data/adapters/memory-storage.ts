import type { ObjectInfo, ObjectStorage } from './types';

/**
 * An in-memory `ObjectStorage` for the unit tests. A presigned URL is a fake
 * `memory://` URL; tests "upload" with `simulateUpload`. `now` is the clock
 * that stamps each object, so tests can age files for the orphan sweep.
 */
export function createMemoryStorage({ now = () => new Date() }: { now?: () => Date } = {}) {
  const objects = new Map<string, ObjectInfo>();
  const bodies = new Map<string, Uint8Array>();

  const storage: ObjectStorage = {
    async presignPut(key, expiresInSeconds) {
      return `memory://upload/${key}?expires=${expiresInSeconds}`;
    },
    async head(key) {
      return objects.get(key) ?? null;
    },
    async get(key) {
      return bodies.get(key) ?? null;
    },
    async put(key, body, contentType) {
      const bytes = typeof body === 'string' ? new TextEncoder().encode(body) : body;
      objects.set(key, { size: bytes.byteLength, contentType, lastModified: now() });
      bodies.set(key, bytes);
    },
    async delete(key) {
      objects.delete(key);
      bodies.delete(key);
    },
    async list(prefix) {
      return [...objects.keys()].filter((key) => key.startsWith(prefix)).sort();
    },
  };

  return Object.assign(storage, {
    /** Test helper: what the browser's PUT to a presigned URL would store. */
    simulateUpload(key: string, info: Omit<ObjectInfo, 'lastModified'>) {
      objects.set(key, { ...info, lastModified: now() });
    },
  });
}

export type MemoryStorage = ReturnType<typeof createMemoryStorage>;
