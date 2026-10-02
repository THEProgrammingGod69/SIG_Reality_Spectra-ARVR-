import type { ReactNode } from 'react';

import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Eyebrow, Text } from '@/components/ui/text';

type PageIntroProps = {
  /** id of the <h1>, which names the section. */
  id: string;
  eyebrow: string;
  title: string;
  /** The page's lead paragraph. */
  lead: string;
  children?: ReactNode;
};

/** The opening block of an inner page: eyebrow, the page's single <h1>, lead. */
export function PageIntro({ id, eyebrow, title, lead, children }: PageIntroProps) {
  return (
    <Section labelledBy={id} className="pb-0">
      <div className="max-w-prose">
        <Eyebrow>{eyebrow}</Eyebrow>
        <Heading level={1} id={id} className="mt-3">
          {title}
        </Heading>
        <Text size="lg" tone="muted" className="mt-5">
          {lead}
        </Text>
        {children}
      </div>
    </Section>
  );
}
