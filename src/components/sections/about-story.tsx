import { Reveal } from '@/components/motion/reveal';
import { Card, CardBody } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';

type AboutStoryProps = {
  /** The long "about us", one string per paragraph. */
  paragraphs: readonly string[];
  /** Short facts beside the story — derived from content, never invented (D-007). */
  facts: readonly { readonly label: string; readonly value: string }[];
};

/** About: the club's story, with an "at a glance" card beside it. */
export function AboutStory({ paragraphs, facts }: AboutStoryProps) {
  return (
    <Section labelledBy="our-story">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
        <Reveal className="flex max-w-prose flex-col gap-6">
          <Heading level={2} id="our-story">
            Our story
          </Heading>
          {paragraphs.map((paragraph) => (
            <Text key={paragraph.slice(0, 32)} size="lg">
              {paragraph}
            </Text>
          ))}
        </Reveal>

        <Card
          as="aside"
          featured
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
