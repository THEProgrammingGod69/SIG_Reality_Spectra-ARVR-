import { PagePlaceholder } from '@/components/ui/page-placeholder';
import { pageMetadata } from '@/lib/metadata';
import { getRoute, routeTitle } from '@/lib/site';

const route = getRoute('/gallery');

export const metadata = pageMetadata(route);

export default function GalleryPage() {
  return (
    <PagePlaceholder title={routeTitle(route)} description={route.description} filledInStage={7} />
  );
}
