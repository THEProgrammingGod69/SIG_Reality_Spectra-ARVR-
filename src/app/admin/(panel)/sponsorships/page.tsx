import type { Metadata } from 'next';

import { PlannedTool } from '@/components/admin/admin-page';

export const metadata: Metadata = { title: 'Sponsorships' };

export default function AdminSponsorshipsPage() {
  return <PlannedTool href="/admin/sponsorships" stage={8} />;
}
