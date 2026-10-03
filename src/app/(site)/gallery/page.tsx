import { ServerCrash } from 'lucide-react';
import { unstable_rethrow } from 'next/navigation';
import { Suspense } from 'react';

import { GalleryBrowser } from '@/components/sections/gallery-browser';
import { PageIntro } from '@/components/sections/page-intro';
import { EmptyState } from '@/components/ui/empty-state';
import { Section } from '@/components/ui/section';
import { Skeleton } from '@/components/ui/skeleton';
import { getGallery } from '@/lib/data';
import { pageMetadata } from '@/lib/metadata';
import { clubCredit, getRoute, routeTitle } from '@/lib/site';

const route = getRoute('/gallery');

export const metadata = pageMetadata(route);

export default function GalleryPage() {
  return (
    <>
      <PageIntro
        id="gallery-title"
        eyebrow={clubCredit}
        title={routeTitle(route)}
        lead={route.description}
      />
      <Section className="pt-12">
        <Suspense fallback={<Skeleton className="h-96 rounded-card" />}>
          <Gallery />
        </Suspense>
      </Section>
    </>
  );
}

async function Gallery() {
  let items: Awaited<ReturnType<typeof getGallery>>;
  try {
    items = await getGallery();
  } catch (error) {
    // Next.js signals request-time rendering by throwing; that is not a failure.
    unstable_rethrow(error);
    console.error('[gallery] Could not load the gallery.', error);
    return (
      <EmptyState
        icon={ServerCrash}
        title="The gallery could not be loaded right now"
        description="Please try again in a moment."
      />
    );
  }
  return <GalleryBrowser items={items} />;
}
