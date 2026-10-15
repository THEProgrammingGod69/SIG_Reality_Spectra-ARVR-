import { ArrowRight } from 'lucide-react';

import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { getRoute } from '@/lib/site';

import { MomentsReel, type Moment } from './moments-reel';
import { SectionHeading } from './section-heading';

export type { Moment } from './moments-reel';

const galleryRoute = getRoute('/gallery');

/**
 * Home: moments from the lab — photos and clip posters from the club's
 * workshops and hackathons on a turning reel (`MomentsReel`), and the way into
 * the gallery for the rest. Its heading copy sits here, like the other Home
 * sections'; the moments come in as props from the page.
 *
 * No moments, no section: an empty reel would only look broken (rule 9).
 */
export function Moments({ moments }: { moments: readonly Moment[] }) {
  if (moments.length === 0) return null;

  return (
    <section aria-labelledby="moments" className="overflow-x-clip py-section">
      <Container>
        <SectionHeading
          id="moments"
          eyebrow="From the lab"
          title="Moments from the lab"
          highlight="lab"
          lead="Workshops, hackathons and the people who make them."
          action={
            <ButtonLink
              href={galleryRoute.href}
              variant="secondary"
              icon={ArrowRight}
              iconPosition="end"
            >
              Open the gallery
            </ButtonLink>
          }
        />
      </Container>
      <MomentsReel moments={moments} label="Photos and clips from the lab" className="mt-12" />
    </section>
  );
}
