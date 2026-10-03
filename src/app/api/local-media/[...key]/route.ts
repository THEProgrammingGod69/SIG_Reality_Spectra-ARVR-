import { localMediaFiles } from '@/lib/data';

/**
 * Local data mode's file route (D-031): stands in for the R2 bucket on a
 * developer's machine. PUT receives an upload at a URL signed by the token
 * route; GET serves it. Answers 404 to everything when files live in R2, and
 * local mode itself is refused on every deployed site.
 */

/** Generous: the attach check enforces the real per-type limits, as with R2. */
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const notFound = () => new Response('Not found', { status: 404 });

export async function GET(
  _request: Request,
  { params }: RouteContext<'/api/local-media/[...key]'>,
) {
  const files = localMediaFiles();
  if (!files) return notFound();
  const file = await files.read((await params).key.join('/')).catch(() => null);
  if (!file) return notFound();
  return new Response(new Uint8Array(file.body), {
    headers: {
      'Content-Type': file.contentType,
      // Every upload gets a new key, so a stored file never changes.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

export async function PUT(request: Request, { params }: RouteContext<'/api/local-media/[...key]'>) {
  const files = localMediaFiles();
  if (!files) return notFound();

  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_UPLOAD_BYTES) return new Response('Too large', { status: 413 });

  const body = new Uint8Array(await request.arrayBuffer());
  if (body.byteLength > MAX_UPLOAD_BYTES) return new Response('Too large', { status: 413 });

  const query = new URL(request.url).searchParams;
  const stored = await files.receive(
    (await params).key.join('/'),
    { expires: query.get('expires'), signature: query.get('signature') },
    body,
    request.headers.get('content-type') ?? 'application/octet-stream',
  );
  return stored ? new Response(null, { status: 200 }) : new Response('Forbidden', { status: 403 });
}
