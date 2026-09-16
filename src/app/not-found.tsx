import Link from 'next/link';

import { siteConfig } from '@/lib/site';

/**
 * Root 404. Stage 3 restyles this with the design system; the copy and the
 * route back to Home stay.
 */
export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-3xl px-6 py-24 sm:py-32">
      <p className="font-mono text-sm text-(--color-muted)">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Page not found</h1>
      <p className="mt-4 text-(--color-muted)">
        That page does not exist, or it is no longer published.
      </p>
      <Link
        href="/"
        className="mt-10 inline-flex rounded-full bg-(--color-accent) px-5 py-2 text-sm font-medium text-(--color-accent-contrast)"
      >
        Back to {siteConfig.shortName}
      </Link>
    </main>
  );
}
