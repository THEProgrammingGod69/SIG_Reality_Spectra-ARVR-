import { ArrowRight, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

import { Stagger } from '@/components/motion/stagger';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import type { DomainGroup } from '@/lib/content';

import { SectionHeading } from './section-heading';

type DomainOverviewProps = {
  groups: readonly DomainGroup[];
};

/**
 * Home: the domains at a glance — names only, technical and non-technical side
 * by side as equal halves (content brief). The full descriptions live on
 * /recruitment, which the call to action opens at the domain list, and each
 * name opens its own description there (D-037).
 *
 * A row lights on hover and keyboard focus: the name slides a step, an arrow
 * arrives and a spectrum line draws under it — `transform` and `opacity` only.
 */
export function DomainOverview({ groups }: DomainOverviewProps) {
  const total = groups.reduce((sum, group) => sum + group.domains.length, 0);

  return (
    <Section labelledBy="domains-overview">
      <SectionHeading
        id="domains-overview"
        eyebrow={`${total} domains`}
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

      <Stagger className="mt-12 grid gap-6 md:grid-cols-2">
        {groups.map((group) => (
          <Card key={group.id} spotlight>
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
                  <li key={domain.id}>
                    <Link
                      href={`/recruitment#${domain.id}` as const}
                      className="group/row relative flex items-baseline gap-4 py-3 after:absolute after:inset-x-0 after:-bottom-px after:h-px after:origin-left after:scale-x-0 after:bg-(image:--gradient-spectra) after:transition-transform after:duration-(--dur-medium) after:ease-out-expo hover:after:scale-x-100 focus-visible:after:scale-x-100"
                    >
                      <span
                        aria-hidden="true"
                        className="font-mono text-label text-(--color-accent)"
                      >
                        {domain.number}
                      </span>
                      <span className="text-body text-(--color-text) transition-transform duration-(--dur-short) ease-out-expo group-hover/row:translate-x-1 group-focus-visible/row:translate-x-1">
                        {domain.name}
                      </span>
                      <Icon
                        icon={ArrowUpRight}
                        size="sm"
                        className="ms-auto -translate-x-1 self-center text-(--color-muted) opacity-0 transition-[opacity,translate] duration-(--dur-short) ease-out-expo group-hover/row:translate-x-0 group-hover/row:opacity-100 group-focus-visible/row:translate-x-0 group-focus-visible/row:opacity-100"
                      />
                    </Link>
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
