import type { Metadata } from 'next';

import { PagePlaceholder } from '@/components/ui/page-placeholder';

export const metadata: Metadata = {
  title: 'Events',
};

export default function AdminEventsPage() {
  return (
    <PagePlaceholder
      title="Events"
      description="Add the current event with its registration link, and complete past events with photos for the timeline."
      filledInStage={7}
    />
  );
}
