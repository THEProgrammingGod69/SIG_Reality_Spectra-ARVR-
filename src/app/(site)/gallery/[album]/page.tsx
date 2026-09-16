import type { Metadata } from 'next';

import { PagePlaceholder } from '@/components/ui/page-placeholder';

/**
 * Gallery album template. Stage 4 replaces this with a masonry layout and an
 * accessible, keyboard-navigable lightbox.
 */
export async function generateMetadata({
  params,
}: PageProps<'/gallery/[album]'>): Promise<Metadata> {
  const { album } = await params;

  return {
    title: `Gallery: ${album}`,
    description: `Photos from ${album}.`,
    alternates: { canonical: `/gallery/${album}` },
  };
}

export default async function GalleryAlbumPage({ params }: PageProps<'/gallery/[album]'>) {
  const { album } = await params;

  return (
    <PagePlaceholder
      title={`Gallery: ${album}`}
      description="Masonry image grid for this album, with an accessible lightbox."
      filledInStage={4}
    />
  );
}
