import { expect, test } from '@playwright/test';

import { hasFiles, hasRecords } from './helpers';

/**
 * The nightly job's route (D-034): only the scheduler, holding CRON_SECRET,
 * may run it; when it runs it backs up and sweeps, and reports both.
 */
const SECRET = process.env.CRON_SECRET!;
const PATH = '/api/cron/nightly';

test('refuses anyone without the secret', async ({ request }) => {
  expect((await request.post(PATH)).status()).toBe(401);
  const wrong = await request.post(PATH, { headers: { Authorization: 'Bearer not-the-secret' } });
  expect(wrong.status()).toBe(401);
  // Vercel Cron calls with GET (D-040): a GET needs the same secret, so a
  // crawler or prefetch can never trigger the job.
  expect((await request.get(PATH)).status()).toBe(401);
});

test('backs up every record and sweeps, then reports both', async ({ request }) => {
  test.skip(!hasRecords || !hasFiles, 'Needs a data store');
  const response = await request.post(PATH, { headers: { Authorization: `Bearer ${SECRET}` } });
  expect(response.status()).toBe(200);
  const report = (await response.json()) as {
    ok: boolean;
    backup: { date: string; records: number };
    sweep: { files: number; deleted: string[]; dryRun: boolean };
  };
  expect(report.ok).toBe(true);
  expect(report.backup.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(report.backup.records).toBeGreaterThanOrEqual(0);
  expect(report.sweep.dryRun).toBe(false);
  expect(report.sweep.files).toBeGreaterThanOrEqual(report.sweep.deleted.length);
});
