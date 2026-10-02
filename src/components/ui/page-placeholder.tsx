import { Badge } from './badge';
import { Heading } from './heading';
import { Section } from './section';
import { Text } from './text';

/**
 * TEMPORARY — Stage 1 scaffolding, restyled on the design system in Stage 3.
 *
 * Every sitemap route renders this so the routing tree is real and testable
 * before any content exists. Stage 4 and later replace each with the actual
 * page. When the last placeholder is gone, delete this file.
 */

type PagePlaceholderProps = {
  /** Page name, rendered as the single <h1>. */
  title: string;
  /** One line describing what this page will hold. */
  description: string;
  /** Which stage fills this page in, so the placeholder explains itself. */
  filledInStage: number;
};

export function PagePlaceholder({ title, description, filledInStage }: PagePlaceholderProps) {
  return (
    <Section width="prose" data-testid="page-placeholder">
      <Heading level={1}>{title}</Heading>
      <Text size="lg" tone="muted" className="mt-4">
        {description}
      </Text>
      <Badge className="mt-10">Placeholder — built in Stage {filledInStage}</Badge>
    </Section>
  );
}
