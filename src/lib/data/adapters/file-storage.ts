import { createHmac, timingSafeEqual } from 'node:crypto';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';

import type { ObjectInfo, ObjectStorage } from './types';

/**
 * Local data mode's `ObjectStorage` (D-031): files under `.data/media`, each
 * with a `.type` file beside it holding its content type.
 *
 * It mimics R2 closely enough that the upload flow is the same: `presignPut`
 * returns a signed, expiring URL on the development server's
 * `/api/local-media` route, the browser PUTs the file there, and the route
 * checks the signature before writing (`receive`).
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
}) {
  const pathOf = (key: string) => {
    const path = join(root, ...key.split('/'));
    if (key.includes('..') || relative(root, path).startsWith('..')) {
      throw new Error(`Invalid storage key "${key}"`);
    }
    return path;
  };
  const sign = (key: string, expires: number) =>
    createHmac('sha256', secret).update(`${key}\n${expires}`).digest('hex');

  async function head(key: string): Promise<ObjectInfo | null> {
    try {
      const info = await stat(pathOf(key));
      const contentType = await readFile(`${pathOf(key)}.type`, 'utf8').catch(() => null);
      return { size: info.size, contentType };
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

  const storage: ObjectStorage = {
    async presignPut(key, expiresInSeconds) {
      const expires = Date.now() + expiresInSeconds * 1000;
      const query = new URLSearchParams({
        expires: String(expires),
        signature: sign(key, expires),
      });
      return `${routePath}/${key}?${query.toString()}`;
    },
    head,
    put,
    async delete(key) {
      await rm(pathOf(key), { force: true });
      await rm(`${pathOf(key)}.type`, { force: true });
    },
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
    /** An upload the browser PUT to a presigned URL: stored only if the signature holds. */
    async receive(
      key: string,
      { expires, signature }: { expires: string | null; signature: string | null },
      body: Uint8Array,
      contentType: string,
    ): Promise<boolean> {
      const until = Number(expires);
      if (!signature || !Number.isFinite(until) || until < Date.now()) return false;
      const expected = Buffer.from(sign(key, until));
      const given = Buffer.from(signature);
      if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
      await put(key, body, contentType);
      return true;
    },
    /** A stored file and its type, for the serving route. */
    async read(key: string): Promise<{ body: Uint8Array; contentType: string } | null> {
      const info = await head(key);
      if (!info) return null;
      return {
        body: await readFile(pathOf(key)),
        contentType: info.contentType ?? 'application/octet-stream',
      };
    },
  });
}

export type FileStorage = ReturnType<typeof createFileStorage>;
