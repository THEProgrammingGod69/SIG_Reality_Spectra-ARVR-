import type { Metadata } from 'next';

import { siteConfig } from '@/lib/site';

/**
 * Everything under /admin: the sign-in page and the panel (`(panel)/`).
 *
 * Two things here are permanent and must not regress:
 *   1. `robots: noindex, nofollow` on every admin route (rule 7).
 *   2. The public site never links to /admin (rule 6). The panel links back to
 *      the public site, never the other way around.
 */
export const metadata: Metadata = {
  title: {
    default: 'Admin',
    template: `%s | Admin — ${siteConfig.name}`,
  },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return children;
}
