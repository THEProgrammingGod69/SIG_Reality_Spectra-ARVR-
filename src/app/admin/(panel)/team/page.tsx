import type { Metadata } from 'next';

import { PlannedTool } from '@/components/admin/admin-page';

export const metadata: Metadata = { title: 'Team' };

export default function AdminTeamPage() {
  return <PlannedTool href="/admin/team" stage={8} />;
}
