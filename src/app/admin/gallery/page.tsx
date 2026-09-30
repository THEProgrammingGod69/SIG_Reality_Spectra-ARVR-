import type { Metadata } from 'next';

import { PagePlaceholder } from '@/components/ui/page-placeholder';

export const metadata: Metadata = {
  title: 'Gallery',
};

export default function AdminGalleryPage() {
  return (
    <PagePlaceholder
      title="Gallery"
      description="Upload standalone club photos and choose a category. Photos of events on the timeline appear in the gallery automatically."
      filledInStage={7}
    />
  );
}
