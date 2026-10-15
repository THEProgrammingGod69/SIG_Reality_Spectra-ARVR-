import type { Metadata } from 'next';

import { siteConfig } from '@/lib/site';

/**
 * Everything under /admin: the sign-in page and the panel (`(panel)/`).
 *
 * Two things here are permanent and must not regress:
 *   1. `robots: noindex, nofollow` on every admin route (rule 7).
 *   2. The public site links to /admin from one place only (rule 6): a small
 *      `rel="nofollow"` "Admin" link to /admin/login in the footer's last row.
 *      Never in the header, the menu, `siteRoutes` or the sitemap; an e2e test
 *      checks every public page.
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
