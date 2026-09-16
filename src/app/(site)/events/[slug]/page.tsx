import type { Metadata } from 'next';

import { PagePlaceholder } from '@/components/ui/page-placeholder';

/**
 * Event detail template. Stage 7 replaces this with a record read through the
 * repository layer, plus the "Register on VIERP" call to action. Unpublished
 * and deleted slugs must return a real 404 from that stage onwards.
 */
export async function generateMetadata({ params }: PageProps<'/events/[slug]'>): Promise<Metadata> {
  const { slug } = await params;

  return {
    title: `Event: ${slug}`,
    description: `Details of the ${slug} event run by SIG Reality Spectra.`,
    alternates: { canonical: `/events/${slug}` },
  };
}

export default async function EventDetailPage({ params }: PageProps<'/events/[slug]'>) {
  const { slug } = await params;

  return (
    <PagePlaceholder
      title={`Event: ${slug}`}
      description="Poster, date and venue, description, add-to-calendar, and the VIERP registration link."
      filledInStage={7}
    />
  );
}
