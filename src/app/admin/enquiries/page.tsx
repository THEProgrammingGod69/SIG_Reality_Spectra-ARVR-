import type { Metadata } from 'next';

import { PagePlaceholder } from '@/components/ui/page-placeholder';

export const metadata: Metadata = {
  title: 'Enquiries',
};

export default function AdminEnquiriesPage() {
  return (
    <PagePlaceholder
      title="Enquiries"
      description="Sponsor and collaboration enquiries, with status filter and CSV export."
      filledInStage={8}
    />
  );
}
