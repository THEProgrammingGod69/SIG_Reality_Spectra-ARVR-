import { ArrowRight } from 'lucide-react';

import { ButtonLink } from '@/components/ui/button';
import type { DomainGroup } from '@/lib/content';

import { DomainRail } from './domain-rail';
import { SectionHeading } from './section-heading';

type DomainOverviewProps = {
  groups: readonly DomainGroup[];
};

/**
 * Home: the domains at a glance — names only, numbered 01–10, each tagged
 * with its half of the club (technical or non-technical). The full
 * descriptions live on /recruitment, which the call to action opens at the
 * domain list, and each name opens its own description there (D-037).
 *
 * From `md` they ride the rail (`DomainRail`, D-038): the section holds still
 * and the panels travel across it as the reader scrolls. On phones, without
 * JavaScript and under reduced motion, the same links are a grid.
 */
export function DomainOverview({ groups }: DomainOverviewProps) {
  const domains = groups.flatMap((group) =>
    group.domains.map((domain) => ({
      id: domain.id,
      number: domain.number,
      name: domain.name,
      group: group.label,
    })),
  );

  return (
    <section aria-labelledby="domains-overview">
      <DomainRail
        domains={domains}
        heading={
          <SectionHeading
            id="domains-overview"
            eyebrow={`${domains.length} domains`}
            title="Find your place in the spectrum"
            highlight="spectrum"
            action={
              <ButtonLink
                href="/recruitment#domains"
                variant="secondary"
                icon={ArrowRight}
                iconPosition="end"
              >
                Explore the domains
              </ButtonLink>
            }
          />
        }
      />
    </section>
  );
}
