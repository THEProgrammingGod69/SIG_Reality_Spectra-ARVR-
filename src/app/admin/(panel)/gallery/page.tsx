import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AdminPageHeader } from '@/components/admin/admin-page';
import { DataUnavailable } from '@/components/admin/data-unavailable';
import { Skeleton } from '@/components/ui/skeleton';
import { archive } from '@/lib/content';
import { adminRead } from '@/lib/data';

import { ArchiveList } from './_components/archive-list';
import { GalleryManager } from './_components/gallery-manager';

export const metadata: Metadata = { title: 'Gallery' };

export default function AdminGalleryPage() {
  return (
    <>
      <AdminPageHeader href="/admin/gallery" />
      <Suspense fallback={<Skeleton className="h-96 rounded-card" />}>
        <GalleryPhotos />
      </Suspense>
      {/* Git content: shown whether or not a data store is set up. */}
      <ArchiveList entries={archive} />
    </>
  );
}

async function GalleryPhotos() {
  const read = await adminRead('the gallery', ({ gallery }) => gallery.list({ order: 'desc' }));
  if ('unavailable' in read) return <DataUnavailable reason={read.unavailable} />;
  return <GalleryManager photos={read.data} />;
}
