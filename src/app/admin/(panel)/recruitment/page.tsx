import type { Metadata } from 'next';

import { PlannedTool } from '@/components/admin/admin-page';

export const metadata: Metadata = { title: 'Recruitment' };

export default function AdminRecruitmentPage() {
  return <PlannedTool href="/admin/recruitment" stage={8} />;
}
