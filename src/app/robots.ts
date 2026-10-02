import type { MetadataRoute } from 'next';

import { absoluteUrl } from '@/lib/env.public';

/**
 * `robots.txt`.
 *
 * The admin panel, the admin-only API (upload tokens) and the /dev tools are
 * excluded from crawling. Admin routes also set `robots: noindex` in their
 * metadata — the two are complementary, not redundant: this stops crawling,
 * that stops indexing of anything already discovered. The sitemap is
 * `sitemap.ts`.
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
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
