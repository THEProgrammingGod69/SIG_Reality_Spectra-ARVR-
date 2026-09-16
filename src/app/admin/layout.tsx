import type { Metadata } from 'next';
import Link from 'next/link';

import { adminRoutes, siteConfig } from '@/lib/site';

/**
 * Admin shell — TEMPORARY Stage 1 scaffolding.
 *
 * Stage 6 replaces this with the real shell (shadcn/ui sidebar, signed-in email,
 * sign-out, toasts, unsaved-changes guard) and puts it behind Auth.js.
 *
 * Two things here are permanent and must not regress:
 *   1. `robots: noindex, nofollow` on every admin route.
 *   2. The public site never links to /admin. This shell links back to the
 *      public site, never the other way around.
 */
export const metadata: Metadata = {
  title: {
    default: 'Admin',
    template: `%s | Admin — ${siteConfig.name}`,
  },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-(--color-border) bg-(--color-surface)">
        <nav
          aria-label="Admin"
          className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4"
        >
          <span className="font-semibold tracking-tight">Admin</span>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            {adminRoutes.map((route) => (
              <li key={route.href}>
                <Link href={route.href} className="text-(--color-muted) hover:text-(--color-text)">
                  {route.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/" className="ms-auto text-sm text-(--color-muted) hover:text-(--color-text)">
            View live site
          </Link>
        </nav>
      </header>

      <main id="main-content" className="flex-1">
        {children}
      </main>
    </div>
  );
}
