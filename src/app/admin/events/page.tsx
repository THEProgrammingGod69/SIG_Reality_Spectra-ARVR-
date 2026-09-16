import type { Metadata } from 'next';

import { PagePlaceholder } from '@/components/ui/page-placeholder';

export const metadata: Metadata = {
  title: 'Events',
};

export default function AdminEventsPage() {
  return (
    <PagePlaceholder
      title="Events"
      description="Create, edit, reorder, publish and delete events."
      filledInStage={7}
    />
  );
}
