import { ArrowRight } from 'lucide-react';

import { Stagger } from '@/components/motion/stagger';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Eyebrow, Text } from '@/components/ui/text';
import type { DomainGroup } from '@/lib/content';

type DomainOverviewProps = {
  groups: readonly DomainGroup[];
};

/**
 * Home: the domains at a glance — names only, technical and non-technical side
 * by side as equal halves (content brief). The full descriptions live on
 * /recruitment, which the call to action opens at the domain list.
 */
export function DomainOverview({ groups }: DomainOverviewProps) {
  const total = groups.reduce((sum, group) => sum + group.domains.length, 0);

  return (
    <Section labelledBy="domains-overview">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-prose">
          <Eyebrow>{total} domains</Eyebrow>
          <Heading level={2} id="domains-overview" className="mt-3">
            Find your place in the spectrum
          </Heading>
        </div>
        <ButtonLink
          href="/recruitment#domains"
          variant="secondary"
          icon={ArrowRight}
          iconPosition="end"
        >
          Explore the domains
        </ButtonLink>
      </div>

      <Stagger className="mt-10 grid gap-6 md:grid-cols-2">
        {groups.map((group) => (
          <Card key={group.id}>
            <CardBody className="gap-6 p-8">
              <div className="flex items-baseline justify-between gap-4">
                <Heading level={3} size="sm">
                  {group.label}
                </Heading>
                <Text as="span" size="sm" tone="subtle">
                  {group.domains.length} domains
                </Text>
              </div>
              <ul className="flex flex-col divide-y divide-(--color-border)">
                {group.domains.map((domain) => (
                  <li key={domain.id} className="flex items-baseline gap-4 py-3">
                    <span aria-hidden="true" className="font-mono text-label text-(--color-accent)">
                      {domain.number}
                    </span>
                    <span className="text-body text-(--color-text)">{domain.name}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ))}
      </Stagger>
    </Section>
  );
}
