import { AwsClient } from 'aws4fetch';

import type { ObjectStorage } from './types';

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

/**
 * The production `ObjectStorage`: Cloudflare R2 through its S3-compatible API
 * (D-025). Requests are signed with AWS Signature V4 by `aws4fetch`, a few KB
 * of fetch-based code instead of the full AWS SDK.
 */
export function createR2Storage({
  accountId,
  accessKeyId,
  secretAccessKey,
  bucket,
}: R2Config): ObjectStorage {
  const client = new AwsClient({ accessKeyId, secretAccessKey, service: 's3', region: 'auto' });
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucket}`;
  const objectUrl = (key: string) =>
    `${endpoint}/${key.split('/').map(encodeURIComponent).join('/')}`;

  async function send(url: string, init: RequestInit, okStatuses: readonly number[]) {
    const response = await client.fetch(url, init);
    if (!response.ok && !okStatuses.includes(response.status)) {
      throw new Error(
        `R2 ${init.method ?? 'GET'} failed with ${response.status}: ${await response.text()}`,
      );
    }
    return response;
  }

  return {
    async presignPut(key, expiresInSeconds) {
      const url = new URL(objectUrl(key));
      url.searchParams.set('X-Amz-Expires', String(expiresInSeconds));
      const signed = await client.sign(url.toString(), { method: 'PUT', aws: { signQuery: true } });
      return signed.url;
    },

    async head(key) {
      const response = await send(objectUrl(key), { method: 'HEAD' }, [404]);
      if (response.status === 404) return null;
      return {
        size: Number(response.headers.get('content-length') ?? 0),
        contentType: response.headers.get('content-type'),
        lastModified: lastModified(response.headers.get('last-modified')),
      };
    },

    async get(key) {
      const response = await send(objectUrl(key), { method: 'GET' }, [404]);
      return response.status === 404 ? null : new Uint8Array(await response.arrayBuffer());
    },

    async put(key, body, contentType) {
      await send(
        objectUrl(key),
        {
          method: 'PUT',
          // A copy typed as an ArrayBuffer view, which fetch accepts as a body.
          body: typeof body === 'string' ? body : new Uint8Array(body),
          headers: { 'Content-Type': contentType },
        },
        [],
      );
    },

    async delete(key) {
      await send(objectUrl(key), { method: 'DELETE' }, [404]);
    },

    async list(prefix) {
      const keys: string[] = [];
      let token: string | null = null;
      do {
        const url = new URL(endpoint);
        url.searchParams.set('list-type', '2');
        url.searchParams.set('prefix', prefix);
        if (token) url.searchParams.set('continuation-token', token);
        const xml = await (await send(url.toString(), { method: 'GET' }, [])).text();
        for (const match of xml.matchAll(/<Key>([^<]*)<\/Key>/g)) keys.push(decodeXml(match[1]!));
        token = /<IsTruncated>true<\/IsTruncated>/.test(xml)
          ? decodeXml(
              /<NextContinuationToken>([^<]*)<\/NextContinuationToken>/.exec(xml)?.[1] ?? '',
            )
          : null;
      } while (token);
      return keys;
    },
  };
}

function lastModified(header: string | null): Date | null {
  const date = header ? new Date(header) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function decodeXml(value: string): string {
  return value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&');
}
