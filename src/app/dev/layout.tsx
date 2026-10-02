import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SmoothScroll } from '@/components/motion/smooth-scroll';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Eyebrow } from '@/components/ui/text';

/**
 * Developer tools (`/dev/*`). Never part of the public site:
 *   - production builds answer 404 for every route under here;
 *   - `noindex` metadata, and `robots.txt` disallows `/dev/`;
 *   - not in `siteRoutes`, so no navigation, footer or sitemap entry links here.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const devPages = [
  { href: '/dev/ui', label: 'UI' },
  { href: '/dev/motion', label: 'Motion' },
] as const;

export default function DevLayout({ children }: LayoutProps<'/dev'>) {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <>
      <SmoothScroll />
      <nav aria-label="Developer tools" className="border-b border-(--color-border)">
        <Container className="flex h-14 items-center gap-2">
          <Eyebrow as="span" className="mr-2">
            /dev
          </Eyebrow>
          {devPages.map((page) => (
            <ButtonLink key={page.href} href={page.href} variant="ghost" size="sm">
              {page.label}
            </ButtonLink>
          ))}
        </Container>
      </nav>
      <main id="main-content" className="flex-1 py-16">
        <Container>{children}</Container>
      </main>
    </>
  );
}
