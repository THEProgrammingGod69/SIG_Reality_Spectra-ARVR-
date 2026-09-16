import type { Metadata } from 'next';

import { PagePlaceholder } from '@/components/ui/page-placeholder';

export const metadata: Metadata = {
  title: 'Recruitment',
};

export default function AdminRecruitmentPage() {
  return (
    <PagePlaceholder
      title="Recruitment"
      description="Toggle recruitment open or closed and set the Google Form URL."
      filledInStage={8}
    />
  );
}
