import type { MetadataRoute } from 'next';

import { absoluteUrl } from '@/lib/env.public';
import { siteRoutes } from '@/lib/site';

/**
 * `sitemap.xml`: the six public pages, straight from `siteRoutes`, so a new
 * page is listed automatically. The sitemap is fixed — there are no per-record
 * URLs (events, photos and members render inline on their list pages). Admin
 * and /dev routes are never listed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return siteRoutes.map((route) => ({
    url: absoluteUrl(route.href),
    priority: route.priority,
  }));
}
