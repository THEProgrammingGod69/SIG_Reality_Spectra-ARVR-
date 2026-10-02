import { PagePlaceholder } from '@/components/ui/page-placeholder';
import { pageMetadata } from '@/lib/metadata';
import { getRoute, routeTitle } from '@/lib/site';

const route = getRoute('/events');

export const metadata = pageMetadata(route);

export default function EventsPage() {
  return (
    <PagePlaceholder title={routeTitle(route)} description={route.description} filledInStage={7} />
  );
}
