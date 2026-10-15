import { Suspense } from 'react';

import { GalleryBrowser } from '@/components/sections/gallery-browser';
import { LoadFailed } from '@/components/sections/load-failed';
import { PageIntro } from '@/components/sections/page-intro';
import { Section } from '@/components/ui/section';
import { Skeleton } from '@/components/ui/skeleton';
import { archiveGallery } from '@/lib/content';
import { getGallery, mergeGallery, publicRead } from '@/lib/data';
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
      <Section className="pt-16">
        <Suspense fallback={<Skeleton className="h-96 rounded-card" />}>
          <Gallery />
        </Suspense>
      </Section>
    </>
  );
}

/**
 * The club archive (Git) and the store's photos, newest first. The archive
 * never depends on the store: with no store it is the whole gallery, and if
 * the store fails it still shows, with a one-line note for the rest.
 */
async function Gallery() {
  const read = await publicRead('the gallery', getGallery);
  const failed = 'failed' in read;
  if (failed && archiveGallery.length === 0) return <LoadFailed what="The gallery" />;
  const items = failed ? mergeGallery(archiveGallery) : mergeGallery(archiveGallery, read.data);
  return (
    <div className="flex flex-col gap-6">
      {failed ? <LoadFailed what="Some photos" inline /> : null}
      <GalleryBrowser items={items} categories={CATEGORIES} />
    </div>
  );
}
