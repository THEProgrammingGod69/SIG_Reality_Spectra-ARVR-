import type { Metadata } from 'next';

import { PagePlaceholder } from '@/components/ui/page-placeholder';

export const metadata: Metadata = {
  title: 'Sponsorships',
};

export default function AdminSponsorshipsPage() {
  return (
    <PagePlaceholder
      title="Sponsorships"
      description="Sponsorship and collaboration requests submitted from the Contact page."
      filledInStage={8}
    />
  );
}
