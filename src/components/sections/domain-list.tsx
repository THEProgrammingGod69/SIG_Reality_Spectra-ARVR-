import { Stagger } from '@/components/motion/stagger';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Eyebrow, Text } from '@/components/ui/text';
import type { DomainGroup } from '@/lib/content';

type DomainListProps = {
  groups: readonly DomainGroup[];
};

/**
 * Recruitment: every domain with its full description, grouped into technical
 * and non-technical — a clear split, equal weight (content brief). Always
 * visible, whether recruitment is open or not. Each card is an anchor
 * (`/recruitment#web-development`).
 */
export function DomainList({ groups }: DomainListProps) {
  return (
    <Section labelledBy="domains-title" id="domains" className="scroll-mt-header">
      <Eyebrow>Technical and non-technical</Eyebrow>
      <Heading level={2} id="domains-title" className="mt-3">
        Our domains
      </Heading>

      <div className="mt-12 flex flex-col gap-16">
        {groups.map((group) => (
          <section key={group.id} aria-labelledby={`domains-${group.id}`}>
            <div className="flex items-center gap-4">
              <Heading level={3} size="md" id={`domains-${group.id}`}>
                {group.label}
              </Heading>
              <Badge tone={group.id === 'technical' ? 'accent' : 'neutral'}>
                {group.domains.length} domains
              </Badge>
            </div>

            <Stagger
              as="ul"
              className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-6"
            >
              {group.domains.map((domain) => (
                <Card key={domain.id} as="li" id={domain.id} className="scroll-mt-header">
                  <CardBody>
                    <span aria-hidden="true" className="font-mono text-label text-(--color-accent)">
                      {domain.number}
                    </span>
                    <Heading level={4} size="sm" className="wrap-anywhere">
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
