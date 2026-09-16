import type { MetadataRoute } from 'next';

import { publicEnv } from '@/lib/env.public';

/**
 * `robots.txt`.
 *
 * The admin panel and the admin-only API (upload tokens) are excluded from crawling now
 * rather than later. Admin routes also set `robots: noindex` in their metadata —
 * the two are complementary, not redundant: this stops crawling, that stops
 * indexing of anything already discovered.
 *
 * Stage 4 adds `sitemap.ts`; the reference below is written now so `robots.txt`
 * does not need editing then.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/', '/dev/'],
      },
    ],
    sitemap: new URL('/sitemap.xml', publicEnv.NEXT_PUBLIC_SITE_URL).toString(),
  };
}
