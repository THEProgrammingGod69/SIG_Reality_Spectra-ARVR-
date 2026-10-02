import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SmoothScroll } from '@/components/motion/smooth-scroll';

/**
 * Developer tools (`/dev/*`). Never part of the public site:
 *   - production builds answer 404 for every route under here;
 *   - `noindex` metadata, and `robots.txt` disallows `/dev/`;
 *   - not in `siteRoutes`, so no navigation, footer or sitemap entry links here.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DevLayout({ children }: LayoutProps<'/dev'>) {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <>
      <SmoothScroll />
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </>
  );
}
