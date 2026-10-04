/**
 * Netlify scheduled function (D-034): once a night, ask the site to back up
 * its records and sweep unused uploads (src/app/api/cron/nightly). Netlify
 * runs scheduled functions on the published production deploy only, so
 * previews never back up or sweep. `URL` is the site's main address, set by
 * Netlify; `CRON_SECRET` must be set for the Production context.
 *
 * 21:00 UTC is 02:30 in India: the quietest hour for the club's admins.
 */
export default async function nightly(): Promise<Response> {
  const site = process.env.URL;
  const secret = process.env.CRON_SECRET;
  if (!site || !secret) {
    console.error('[nightly] URL or CRON_SECRET is missing; nothing was run.');
    return new Response('Not configured', { status: 500 });
  }
  const response = await fetch(new URL('/api/cron/nightly', site), {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
  });
  const report = await response.text();
  if (!response.ok) console.error(`[nightly] Failed (${response.status}): ${report}`);
  else console.log(`[nightly] ${report}`);
  return new Response(report, { status: response.status });
}

export const config = { schedule: '0 21 * * *' };
