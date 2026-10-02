import { Stagger } from '@/components/motion/stagger';
import { Card, CardBody } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Eyebrow, Text } from '@/components/ui/text';
import type { SiteInfo } from '@/lib/schemas/content';

type MissionVisionProps = Pick<SiteInfo, 'mission' | 'vision'> & {
  /** Section heading id; must be unique on the page. */
  id?: string;
};

/** Mission and vision side by side — Home and About. */
export function MissionVision({ mission, vision, id = 'mission-vision' }: MissionVisionProps) {
  const statements = [
    { label: 'Mission', body: mission },
    { label: 'Vision', body: vision },
  ];

  return (
    <Section labelledBy={id}>
      <Heading level={2} id={id}>
        What we stand for
      </Heading>
      <Stagger as="ul" className="mt-10 grid gap-6 md:grid-cols-2">
        {statements.map((statement, index) => (
          <Card key={statement.label} as="li" featured={index === 0}>
            <CardBody className="gap-4 p-8">
              <Eyebrow className="text-(--color-accent)">{statement.label}</Eyebrow>
              <Text size="lg">{statement.body}</Text>
            </CardBody>
          </Card>
        ))}
      </Stagger>
    </Section>
  );
}
