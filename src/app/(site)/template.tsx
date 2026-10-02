import type { ReactNode } from 'react';

import { PageTransition } from '@/components/site/page-transition';

/** Remounts on every navigation, so each new page can fade in (PageTransition). */
export default function SiteTemplate({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
