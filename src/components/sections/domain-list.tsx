import { Stagger } from '@/components/motion/stagger';
import { HashTarget } from '@/components/site/hash-target';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { HudCorners } from '@/components/ui/hud-corners';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import type { DomainGroup } from '@/lib/content';

import { SectionHeading } from './section-heading';

type DomainListProps = {
  groups: readonly DomainGroup[];
};

/**
 * Recruitment: every domain with its full description, grouped into technical
 * and non-technical — a clear split, equal weight (content brief). Always
 * visible, whether recruitment is open or not. Each card is an anchor
 * (`/recruitment#web-development`) — Home's domain rows land on them.
 *
 * Cards carry their number in hollow display type and the spotlight (D-037);
 * on hover, and on the card a link arrived at, corner brackets lock onto it
 * (`HudCorners`, D-038) — `scale` and `opacity` only.
 */
export function DomainList({ groups }: DomainListProps) {
  return (
    <Section labelledBy="domains-title" id="domains" className="scroll-mt-header">
      <SectionHeading
        id="domains-title"
        eyebrow="Technical and non-technical"
        title="Our domains"
      />

      <HashTarget />
      <div className="mt-14 flex flex-col gap-16">
        {groups.map((group) => (
          <section key={group.id} aria-labelledby={`domains-${group.id}`}>
            <div className="flex items-center gap-4">
              <Heading level={3} size="md" id={`domains-${group.id}`}>
                {group.label}
              </Heading>
              <Badge tone={group.id === 'technical' ? 'accent' : 'neutral'}>
                {group.domains.length} domains
              </Badge>
              <span
                aria-hidden="true"
                className="hidden h-px flex-1 bg-(--color-border) sm:block"
              />
            </div>

            <Stagger
              as="ul"
              className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-6"
            >
              {group.domains.map((domain) => (
                <Card
                  key={domain.id}
                  as="li"
                  id={domain.id}
                  spotlight
                  // Arriving from a Home domain link: land clear of the header,
                  // with the chosen domain outlined in the accent — `:target`
                  // on a full load, `data-targeted` (HashTarget) after a
                  // client navigation, which never sets `:target`.
                  className="group/domain scroll-mt-[calc(var(--spacing-header)+2rem)] target:border-(--color-accent) data-targeted:border-(--color-accent)"
                >
                  <HudCorners
                    className="inset-2.5 scale-110 text-(--color-accent) opacity-0 transition-[scale,opacity] duration-(--dur-medium) ease-out-expo group-target/domain:scale-100 group-target/domain:opacity-100 group-hover/domain:scale-100 group-hover/domain:opacity-100 group-data-targeted/domain:scale-100 group-data-targeted/domain:opacity-100"
                    cornerClassName="size-3"
                  />
                  <CardBody className="gap-4 p-7">
                    <span
                      aria-hidden="true"
                      className="origin-left font-display text-display-lg leading-none text-outline transition-transform duration-(--dur-long) ease-out-expo group-hover/domain:translate-x-1"
                    >
                      {domain.number}
                    </span>
                    <Heading level={4} size="sm" className="mt-2 wrap-anywhere">
                      {domain.name}
                    </Heading>
                    <Text size="sm" tone="muted">
                      {domain.description}
                    </Text>
                  </CardBody>
                </Card>
              ))}
            </Stagger>
          </section>
        ))}
      </div>
    </Section>
  );
}
