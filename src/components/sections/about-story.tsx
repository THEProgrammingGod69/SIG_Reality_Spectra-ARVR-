import { Reveal } from '@/components/motion/reveal';
import { Card, CardBody } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';

import { SectionHeading } from './section-heading';

type AboutStoryProps = {
  /** The long "about us", one string per paragraph. */
  paragraphs: readonly string[];
  /** Short facts beside the story — derived from content, never invented (D-007). */
  facts: readonly { readonly label: string; readonly value: string }[];
};

/**
 * About: the club's story, with an "at a glance" card beside it. The first
 * paragraph opens in the primary text colour as the story's lead, the rest
 * follow in body colour (D-037).
 */
export function AboutStory({ paragraphs, facts }: AboutStoryProps) {
  return (
    <Section labelledBy="our-story">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex max-w-prose flex-col gap-6">
          <SectionHeading id="our-story" eyebrow="The club" title="Our story" />
          <Reveal className="flex flex-col gap-6">
            {paragraphs.map((paragraph, index) => (
              <Text key={paragraph.slice(0, 32)} size="lg" tone={index === 0 ? 'primary' : 'body'}>
                {paragraph}
              </Text>
            ))}
          </Reveal>
        </div>

        <Card
          as="aside"
          featured
          spotlight
          aria-labelledby="at-a-glance"
          // Sized to its content, not stretched to the story's height.
          className="h-auto lg:sticky lg:top-24"
        >
          <CardBody className="gap-6 p-8">
            <Heading level={3} size="sm" id="at-a-glance">
              At a glance
            </Heading>
            <dl className="flex flex-col divide-y divide-(--color-border)">
              {facts.map((fact) => (
                <div key={fact.label} className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0">
                  <dt className="font-mono text-label text-(--color-muted) uppercase">
                    {fact.label}
                  </dt>
                  <dd className="text-(--color-text)">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>
      </div>
    </Section>
  );
}
