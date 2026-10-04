import { Suspense } from 'react';

import { GalleryBrowser } from '@/components/sections/gallery-browser';
import { LoadFailed } from '@/components/sections/load-failed';
import { PageIntro } from '@/components/sections/page-intro';
import { Section } from '@/components/ui/section';
import { Skeleton } from '@/components/ui/skeleton';
import { getGallery, publicRead } from '@/lib/data';
import { pageMetadata } from '@/lib/metadata';
import { CATEGORIES } from '@/lib/schemas/category';
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
  const read = await publicRead('the gallery', getGallery);
  if ('failed' in read) return <LoadFailed what="The gallery" />;
  return <GalleryBrowser items={read.data} categories={CATEGORIES} />;
}
