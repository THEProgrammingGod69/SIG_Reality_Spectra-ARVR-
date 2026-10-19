import { connection } from 'next/server';

import { dataAvailability, repositories } from '@/lib/data';

/**
 * Is this deployment's data store connected and answering? For a quick check
 * after a deploy, or an uptime monitor: which kind of store it uses, and
 * whether one read (counting the events) works. No records, settings or
 * secrets are returned (D-041). 200 when it can read, 503 when it cannot.
 */
export async function GET() {
  await connection();
  const { backend, records, files } = dataAvailability();
  let read: 'ok' | 'failed' | 'not-configured' = 'not-configured';
  if (records) {
    read = await repositories()
      .events.count()
      .then(() => 'ok' as const)
      .catch((error: unknown) => {
        console.error('[health] The data store did not answer.', error);
        return 'failed' as const;
      });
  }
  const ok = read === 'ok' && files;
  return Response.json(
    { ok, backend, records: read, uploads: files ? 'ready' : 'not-configured' },
    { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
