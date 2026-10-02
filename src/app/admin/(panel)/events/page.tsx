import type { Metadata } from 'next';

import { PlannedTool } from '@/components/admin/admin-page';

export const metadata: Metadata = { title: 'Events' };

export default function AdminEventsPage() {
  return <PlannedTool href="/admin/events" stage={7} />;
}
