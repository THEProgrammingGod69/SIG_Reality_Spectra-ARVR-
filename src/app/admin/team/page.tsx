import type { Metadata } from 'next';

import { PagePlaceholder } from '@/components/ui/page-placeholder';

export const metadata: Metadata = {
  title: 'Team',
};

export default function AdminTeamPage() {
  return (
    <PagePlaceholder
      title="Team"
      description="Add team members with name, position and photo; mark core members to show them on the home page."
      filledInStage={8}
    />
  );
}
