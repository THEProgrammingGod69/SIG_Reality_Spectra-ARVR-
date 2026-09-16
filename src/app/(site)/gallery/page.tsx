import type { Metadata } from 'next';

import { PagePlaceholder } from '@/components/ui/page-placeholder';
import { getRoute, routeTitle } from '@/lib/site';

const route = getRoute('/gallery');

export const metadata: Metadata = {
  title: routeTitle(route),
  description: route.description,
  alternates: { canonical: route.href },
};

export default function GalleryPage() {
  return (
    <PagePlaceholder title={routeTitle(route)} description={route.description} filledInStage={7} />
  );
}
