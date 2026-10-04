import { isBearer } from '@/lib/auth/policy';
import { dataAvailability, repositories } from '@/lib/data';
import { env } from '@/lib/env';

/**
 * The nightly job (D-034): back up every record to the file storage, then
 * sweep uploaded files no record uses. The Netlify scheduled function
 * (netlify/functions/nightly.mts) calls it with `Authorization: Bearer
 * $CRON_SECRET`; anyone else gets 401. It can also be run by hand:
 * `pnpm data backup` / `pnpm data sweep`.
 *
 * A failed backup stops the job before the sweep: files are only ever
 * deleted on a night whose records are safely backed up.
 */
export async function POST(request: Request) {
  const secret = env.CRON_SECRET;
  if (!secret) {
    return Response.json({ ok: false, error: 'CRON_SECRET is not set' }, { status: 503 });
  }
  if (!isBearer(request.headers.get('authorization'), secret)) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const available = dataAvailability();
  if (!available.records || !available.files) {
    return Response.json({ ok: false, error: 'No data store configured' }, { status: 503 });
  }

  const { maintenance } = repositories();
  try {
    const backup = await maintenance.backup();
    const sweep = await maintenance.sweep();
    console.log(
      `[nightly] Backed up ${backup.records} records (${backup.date}); removed ${backup.removed.length} old backups; ` +
        `swept ${sweep.deleted.length} of ${sweep.files} files.`,
    );
    return Response.json({ ok: true, backup, sweep });
  } catch (error) {
    console.error('[nightly] The nightly job failed.', error);
    const message = error instanceof Error ? error.message : 'The nightly job failed';
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
