import type { ReactNode } from 'react';

import { SplitText } from '@/components/motion/split-text';
import { Heading } from '@/components/ui/heading';
import { LabBackdrop } from '@/components/ui/lab-backdrop';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';

import { IntroField } from './intro-field';
import { EyebrowDash } from './section-heading';

type PageIntroProps = {
  /** id of the <h1>, which names the section. */
  id: string;
  eyebrow: string;
  title: string;
  /** The page's lead paragraph. */
  lead: string;
  /** One word of the title drawn in the spectrum. */
  highlight?: string;
  children?: ReactNode;
};

/**
 * The opening block of an inner page: eyebrow, the page's single <h1>, lead —
 * set in the lab (D-037). The section runs under the transparent header
 * (`data-full-bleed`, like the home hero) so the backdrop's grid, light and
 * orbit reach the top of the screen, and clears the header with its padding.
 *
 * On capable devices, light falls into the lab through haze behind it all
 * (`IntroField`, D-038), answering the pointer and the scroll.
 *
 * The title's words rise out of their masks at first paint, in CSS
 * (`SplitText play="load"`), and the eyebrow and lead fade up with them, so
 * the opening plays on every visit and every client navigation without
 * waiting for JavaScript. All of it is real text from the first paint; reduced
 * motion shows it at rest.
 */
export function PageIntro({ id, eyebrow, title, lead, highlight, children }: PageIntroProps) {
  return (
    <Section
      labelledBy={id}
      data-full-bleed
      className="relative isolate overflow-hidden pt-[calc(var(--spacing-header)+var(--spacing-section))] pb-0"
    >
      <IntroField />
      <LabBackdrop />
      <div className="max-w-3xl">
        <EyebrowDash className="animate-intro-in">{eyebrow}</EyebrowDash>
        <Heading level={1} id={id} className="mt-5">
          <SplitText text={title} highlight={highlight} play="load" />
        </Heading>
        <Text size="lg" tone="muted" className="mt-6 max-w-prose animate-intro-in">
          {lead}
        </Text>
        {children}
      </div>
    </Section>
  );
}
