import type { Metadata } from 'next';

import { PagePlaceholder } from '@/components/ui/page-placeholder';

export const metadata: Metadata = {
  title: 'Recruitment',
};

export default function AdminRecruitmentPage() {
  return (
    <PagePlaceholder
      title="Recruitment"
      description="Open or close recruitment, upload the roles and responsibilities PDF, and set the Google Form link."
      filledInStage={8}
    />
  );
}
