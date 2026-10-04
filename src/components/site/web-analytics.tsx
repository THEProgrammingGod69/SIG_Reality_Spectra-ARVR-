import Script from 'next/script';

import { publicEnv } from '@/lib/env.public';

/**
 * Cloudflare Web Analytics on the public site (D-033): cookieless page-view
 * counts, no personal data, so no consent banner. Loads only where its token
 * is set, never under `next dev`, and never in the admin panel (this sits in
 * the public layout). `spa` counts client-side navigations as page views.
 * The CSP allows its script and report origins (src/lib/security-headers.ts).
 */
export function WebAnalytics() {
  const token = publicEnv.NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN;
  if (!token || process.env.NODE_ENV === 'development') return null;
  return (
    <Script
      src="https://static.cloudflareinsights.com/beacon.min.js"
      strategy="afterInteractive"
      data-cf-beacon={JSON.stringify({ token, spa: true })}
    />
  );
}
