import type { Metadata } from 'next';

import { PagePlaceholder } from '@/components/ui/page-placeholder';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function AdminDashboardPage() {
  return (
    <PagePlaceholder
      title="Dashboard"
      description="Counts for published events, drafts and new enquiries, plus recruitment status."
      filledInStage={6}
    />
  );
}
