import type { Metadata } from 'next';

import { PagePlaceholder } from '@/components/ui/page-placeholder';
import { getRoute, routeTitle } from '@/lib/site';

const route = getRoute('/join');

export const metadata: Metadata = {
  title: routeTitle(route),
  description: route.description,
  alternates: { canonical: route.href },
};

export default function JoinPage() {
  return (
    <PagePlaceholder title={routeTitle(route)} description={route.description} filledInStage={8} />
  );
}
