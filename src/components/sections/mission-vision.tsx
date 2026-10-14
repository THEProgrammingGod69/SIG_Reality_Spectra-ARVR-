import { Compass, Sparkles, Telescope, type LucideIcon } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

import { DecodeText } from '@/components/motion/decode-text';
import { SplitText } from '@/components/motion/split-text';
import { Stack } from '@/components/motion/stack';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Section } from '@/components/ui/section';
import { Eyebrow, Text } from '@/components/ui/text';
import type { SiteInfo } from '@/lib/schemas/content';

import { SectionHeading } from './section-heading';

type MissionVisionProps = Pick<SiteInfo, 'mission' | 'vision'> & {
  /** Section heading id; must be unique on the page. */
  id?: string;
  /** The motto as a closing third panel (Home; About lists it among its facts). */
  motto?: SiteInfo['motto'];
};

type Statement = { label: string; icon: LucideIcon; body: ReactNode };

/**
 * Mission and vision — Home and About — as panels that stack while the reader
 * scrolls (`Stack`, D-038): each sticks a step below the last and slides over
 * it, and the one beneath steps back into the dark. On Home the motto closes
 * the stack, set large. Each panel is a lit card (`spotlight`, D-037) with its
 * number in hollow display type and its label decoding as it arrives.
 *
 * Below `md`, on short screens and under reduced motion: a plain list.
 */
export function MissionVision({
  mission,
  vision,
  motto,
  id = 'mission-vision',
}: MissionVisionProps) {
  const statements: Statement[] = [
    { label: 'Mission', icon: Compass, body: <Text size="lg">{mission}</Text> },
    { label: 'Vision', icon: Telescope, body: <Text size="lg">{vision}</Text> },
  ];
  if (motto) {
    statements.push({
      label: 'Motto',
      icon: Sparkles,
      body: (
        <p className="font-display text-display-xl text-(--color-text)">
          <SplitText text={motto} highlight={motto.split(/\s+/).at(-1)} />
        </p>
      ),
    });
  }

  return (
    <Section labelledBy={id}>
      <SectionHeading id={id} eyebrow="Purpose" title="What we stand for" />
      <Stack className="mt-12 gap-6 stack:pb-16">
        {statements.map((statement, index) => (
          <li
            key={statement.label}
            style={{ '--stack-index': index } as CSSProperties}
            className="stack:sticky stack:top-[calc(var(--spacing-header)+1.5rem+var(--stack-index)*1.5rem)]"
          >
            <div data-stack-body className="origin-top">
              <Card featured={index === 0} spotlight>
                <div className="grid gap-8 p-8 md:p-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12">
                  <div className="flex items-start justify-between gap-6 lg:flex-col">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex size-10 items-center justify-center rounded-full border border-(--color-border-strong) text-(--color-accent)">
                        <Icon icon={statement.icon} size="md" />
                      </span>
                      <Eyebrow className="text-(--color-accent)">
                        <DecodeText text={statement.label} />
                      </Eyebrow>
                    </div>
                    <span
                      aria-hidden="true"
                      className="font-display text-display-xl leading-none text-outline"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="self-center">{statement.body}</div>
                </div>
                <span
                  aria-hidden="true"
                  data-stack-scrim
                  className="pointer-events-none absolute inset-0 z-10 bg-(--color-bg)/70 opacity-0"
                />
              </Card>
            </div>
          </li>
        ))}
      </Stack>
    </Section>
  );
}
