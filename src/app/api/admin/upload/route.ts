import { getAdminSession } from '@/lib/auth/session';
import { DataError, repositories } from '@/lib/data';
import { isConfigured } from '@/lib/integrations';

/**
 * POST /api/admin/upload — a short-lived URL the admin panel uploads one file
 * to, straight from the browser (rule 11). Body: an `UploadRequest`
 * (`src/lib/schemas/upload.ts`); reply: an `UploadTicket`.
 *
 * The file itself never reaches this function. Attaching the uploaded URL to a
 * record is a separate Server Action, which verifies the file (`media.verify`)
 * and refreshes the cache tags; a Route Handler cannot call `updateTag`.
 */

const noStore = { 'Cache-Control': 'no-store' };

function reply(body: unknown, status = 200) {
  return Response.json(body, { status, headers: noStore });
}

export async function POST(request: Request) {
  // Browsers always send Origin on a cross-site POST; refuse anything not from
  // this site, on top of the session check.
  const origin = request.headers.get('origin');
  if (origin !== null && origin !== new URL(request.url).origin) {
    return reply({ error: 'Cross-site requests are not allowed.' }, 403);
  }

  // Never trust the proxy alone (rule 8): the route checks the session itself.
  const session = await getAdminSession();
  if (session === null) {
    return reply({ error: 'Sign in as an admin to upload files.' }, 401);
  }

  if (!isConfigured('r2')) {
    return reply({ error: 'File storage is not configured on this site yet.' }, 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return reply({ error: 'Expected a JSON body.' }, 400);
  }

  try {
    return reply(await repositories().media.createUpload(body));
  } catch (error) {
    if (error instanceof DataError) {
      return reply({ error: error.message, issues: 'issues' in error ? error.issues : [] }, 400);
    }
    console.error('[upload] Could not issue an upload URL.', error);
    return reply({ error: 'The upload could not be started. Try again in a moment.' }, 500);
  }
}
