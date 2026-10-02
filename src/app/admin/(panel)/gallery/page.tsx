import type { Metadata } from 'next';

import { PlannedTool } from '@/components/admin/admin-page';

export const metadata: Metadata = { title: 'Gallery' };

export default function AdminGalleryPage() {
  return <PlannedTool href="/admin/gallery" stage={7} />;
}
