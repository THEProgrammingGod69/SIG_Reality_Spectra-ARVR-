import type { Metadata } from 'next';

import { PagePlaceholder } from '@/components/ui/page-placeholder';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function AdminDashboardPage() {
  return (
    <PagePlaceholder
      title="Dashboard"
      description="Upcoming events, events waiting for the timeline, new sponsorship requests and recruitment status."
      filledInStage={6}
    />
  );
}
