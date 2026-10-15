import { hostedMediaFiles, MAX_HOSTED_UPLOAD_BYTES } from '@/lib/data';

/**
 * The file route for storage the site hosts itself: Netlify Blobs on the
 * deployed site, the `.data` folder in local data mode (D-031). The path
 * keeps its local-mode name so stored URLs, `next/image` and the CSP need
 * nothing new. Answers 404 to everything when files live in R2.
 *
 * - PUT receives an upload, or one part of it, at a URL signed by the token
 *   route. The storage checks the signature, the type against the key and
 *   the size before storing anything (`adapters/hosted-uploads.ts`).
 * - GET streams an uploaded file back. Only uploads are served (never a
 *   backup or an upload part), with `nosniff` and a sandboxing CSP as a second
 *   line of defence behind the type check.
 */

const notFound = () =>
  new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });

function files() {
  try {
    return hostedMediaFiles();
  } catch (error) {
    console.error('[media] File storage is not available.', error);
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: RouteContext<'/api/local-media/[...key]'>,
) {
  const storage = files();
  if (!storage) return notFound();
  const file = await storage.read((await params).key.join('/')).catch((error: unknown) => {
    console.error('[media] Could not read a file.', error);
    return null;
  });
  if (!file) return notFound();
  return new Response(file.body instanceof Uint8Array ? new Uint8Array(file.body) : file.body, {
    headers: {
      'Content-Type': file.contentType,
      // Every upload gets a new key, so a stored file never changes.
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  });
}

export async function PUT(request: Request, { params }: RouteContext<'/api/local-media/[...key]'>) {
  const storage = files();
  if (!storage) return notFound();

  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_HOSTED_UPLOAD_BYTES) return new Response('Too large', { status: 413 });

  const body = new Uint8Array(await request.arrayBuffer());
  if (body.byteLength > MAX_HOSTED_UPLOAD_BYTES) return new Response('Too large', { status: 413 });

  const query = new URL(request.url).searchParams;
  const result = await storage
    .receive(
      (await params).key.join('/'),
      {
        expires: query.get('expires'),
        signature: query.get('signature'),
        part: query.get('part'),
        parts: query.get('parts'),
      },
      body,
      request.headers.get('content-type') ?? '',
    )
    .catch((error: unknown) => {
      console.error('[media] Could not store an upload.', error);
      return {
        ok: false,
        status: 503,
        reason: 'The file could not be stored. Try again.',
      } as const;
    });
  return result.ok
    ? new Response(null, { status: 200 })
    : new Response(result.reason, { status: result.status });
}
