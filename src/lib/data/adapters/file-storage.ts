import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';

import {
  createHostedUploads,
  type HostedStorage,
  isUploadKey,
  uploadKindOf,
} from './hosted-uploads';
import type { ObjectInfo, ObjectStorage } from './types';

/**
 * Local data mode's `ObjectStorage` (D-031): files under `.data/media`, each
 * with a `.type` file beside it holding its content type.
 *
 * It mimics R2 closely enough that the upload flow is the same: `presignPut`
 * returns a signed, expiring URL on the development server's
 * `/api/local-media` route, the browser PUTs the file there, and the route
 * checks the signature, type and size before writing (`receive`, shared with
 * Netlify Blobs in `hosted-uploads.ts`).
 */
export function createFileStorage({
  root,
  routePath,
  secret,
}: {
  /** Folder that holds the files. */
  root: string;
  /** The route that receives and serves them, e.g. /api/local-media. */
  routePath: string;
  /** Signs upload URLs; local mode uses AUTH_SECRET. */
  secret: string;
}): HostedStorage {
  const pathOf = (key: string) => {
    const path = join(root, ...key.split('/'));
    if (key.includes('..') || relative(root, path).startsWith('..')) {
      throw new Error(`Invalid storage key "${key}"`);
    }
    return path;
  };

  async function head(key: string): Promise<ObjectInfo | null> {
    try {
      const info = await stat(pathOf(key));
      const contentType = await readFile(`${pathOf(key)}.type`, 'utf8').catch(() => null);
      return { size: info.size, contentType, lastModified: info.mtime };
    } catch {
      return null;
    }
  }

  async function put(key: string, body: string | Uint8Array, contentType: string) {
    const path = pathOf(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
    await writeFile(`${path}.type`, contentType);
  }

  async function get(key: string): Promise<Uint8Array | null> {
    return readFile(pathOf(key)).then(
      (body) => new Uint8Array(body),
      () => null,
    );
  }

  async function remove(key: string) {
    await rm(pathOf(key), { force: true });
    await rm(`${pathOf(key)}.type`, { force: true });
  }

  const uploads = createHostedUploads({ secret, routePath, storage: { put, get, delete: remove } });

  const storage: ObjectStorage = {
    presignPut: uploads.presignPut,
    head,
    get,
    put,
    delete: remove,
    async list(prefix) {
      const entries = await readdir(root, { recursive: true, withFileTypes: true }).catch(() => []);
      return entries
        .filter((entry) => entry.isFile() && !entry.name.endsWith('.type'))
        .map((entry) => relative(root, join(entry.parentPath, entry.name)).split(sep).join('/'))
        .filter((key) => key.startsWith(prefix))
        .sort();
    },
  };

  return Object.assign(storage, {
    receive: uploads.receive,
    async read(key: string) {
      if (!isUploadKey(key)) return null; // Backups and upload parts are never served.
      const [info, body] = await Promise.all([head(key), get(key)]);
      if (!info?.contentType || !body || uploadKindOf(key, info.contentType) === null) return null;
      return { body, contentType: info.contentType };
    },
  });
}
