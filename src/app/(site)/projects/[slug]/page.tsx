import type { Metadata } from 'next';

import { PagePlaceholder } from '@/components/ui/page-placeholder';

/**
 * Project detail template. Stage 4 replaces this with real content loaded from
 * `src/content/projects/*.json` and adds `generateStaticParams`.
 *
 * Note for Next.js 16: `params` is a Promise and must be awaited.
 */
export async function generateMetadata({
  params,
}: PageProps<'/projects/[slug]'>): Promise<Metadata> {
  const { slug } = await params;

  return {
    title: `Project: ${slug}`,
    description: `Details of the ${slug} project by SIG Reality Spectra.`,
    alternates: { canonical: `/projects/${slug}` },
  };
}

export default async function ProjectDetailPage({ params }: PageProps<'/projects/[slug]'>) {
  const { slug } = await params;

  return (
    <PagePlaceholder
      title={`Project: ${slug}`}
      description="Hero image, one-line pitch, description, tech tags, team credits and a GitHub link."
      filledInStage={4}
    />
  );
}
