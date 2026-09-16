import type { Metadata } from 'next';

import { PagePlaceholder } from '@/components/ui/page-placeholder';
import { getRoute, routeTitle } from '@/lib/site';

const route = getRoute('/');

export const metadata: Metadata = {
  // Home keeps the root layout's default title (no '| SIG Reality Spectra' suffix).
  description: route.description,
  alternates: { canonical: route.href },
};

export default function HomePage() {
  return (
    <PagePlaceholder title={routeTitle(route)} description={route.description} filledInStage={4} />
  );
}
