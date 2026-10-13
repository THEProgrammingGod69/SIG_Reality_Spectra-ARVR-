import { Compass, Telescope } from 'lucide-react';

import { Stagger } from '@/components/motion/stagger';
import { Card, CardBody } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Section } from '@/components/ui/section';
import { Eyebrow, Text } from '@/components/ui/text';
import type { SiteInfo } from '@/lib/schemas/content';

import { SectionHeading } from './section-heading';

type MissionVisionProps = Pick<SiteInfo, 'mission' | 'vision'> & {
  /** Section heading id; must be unique on the page. */
  id?: string;
};

/**
 * Mission and vision side by side — Home and About. Each is a lit card
 * (`spotlight`, D-037) numbered in hollow display type.
 */
export function MissionVision({ mission, vision, id = 'mission-vision' }: MissionVisionProps) {
  const statements = [
    { label: 'Mission', body: mission, icon: Compass },
    { label: 'Vision', body: vision, icon: Telescope },
  ];

  return (
    <Section labelledBy={id}>
      <SectionHeading id={id} eyebrow="Purpose" title="What we stand for" />
      <Stagger as="ul" className="mt-12 grid gap-6 md:grid-cols-2">
        {statements.map((statement, index) => (
          <Card key={statement.label} as="li" featured={index === 0} spotlight>
            <CardBody className="gap-8 p-8 md:p-10">
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-full border border-(--color-border-strong) text-(--color-accent)">
                    <Icon icon={statement.icon} size="md" />
                  </span>
                  <Eyebrow className="text-(--color-accent)">{statement.label}</Eyebrow>
                </div>
                <span
                  aria-hidden="true"
                  className="font-display text-display-xl leading-none text-outline"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <Text size="lg">{statement.body}</Text>
            </CardBody>
          </Card>
        ))}
      </Stagger>
    </Section>
  );
}
