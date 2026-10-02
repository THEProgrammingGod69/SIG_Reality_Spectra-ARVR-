import type { ObjectInfo, ObjectStorage } from './types';

/**
 * An in-memory `ObjectStorage` for the unit tests. A presigned URL is a fake
 * `memory://` URL; tests "upload" with `simulateUpload`.
 */
export function createMemoryStorage() {
  const objects = new Map<string, ObjectInfo>();

  const storage: ObjectStorage = {
    async presignPut(key, expiresInSeconds) {
      return `memory://upload/${key}?expires=${expiresInSeconds}`;
    },
    async head(key) {
      return objects.get(key) ?? null;
    },
    async put(key, body, contentType) {
      objects.set(key, { size: new TextEncoder().encode(body).byteLength, contentType });
    },
    async delete(key) {
      objects.delete(key);
    },
    async list(prefix) {
      return [...objects.keys()].filter((key) => key.startsWith(prefix)).sort();
    },
  };

  return Object.assign(storage, {
    /** Test helper: what the browser's PUT to a presigned URL would store. */
    simulateUpload(key: string, info: ObjectInfo) {
      objects.set(key, info);
    },
  });
}

export type MemoryStorage = ReturnType<typeof createMemoryStorage>;
