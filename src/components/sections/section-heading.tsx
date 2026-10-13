import type { ReactNode } from 'react';

import { SplitText } from '@/components/motion/split-text';
import { Heading, type HeadingSize } from '@/components/ui/heading';
import { Eyebrow, Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';

type SectionHeadingProps = {
  /** id of the heading, which names its section. Unique on the page. */
  id: string;
  title: string;
  /** A short mono label above the title, led by a spectrum dash. */
  eyebrow?: string;
  /** One word of the title drawn in the spectrum (SplitText `highlight`). */
  highlight?: string;
  lead?: ReactNode;
  level?: 2 | 3;
  size?: HeadingSize;
  /** A call to action beside the heading from `md` up, below it on phones. */
  action?: ReactNode;
  className?: string;
};

/**
 * The opening of a content section (D-037): eyebrow, a heading whose words
 * rise into place as it scrolls into view, an optional lead and action. One
 * pattern for every section, so the pages read as one system.
 */
export function SectionHeading({
  id,
  title,
  eyebrow,
  highlight,
  lead,
  level = 2,
  size,
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-12',
        className,
      )}
    >
      <div className="max-w-prose">
        {eyebrow ? <EyebrowDash>{eyebrow}</EyebrowDash> : null}
        <Heading level={level} size={size} id={id} className={eyebrow ? 'mt-4' : undefined}>
          <SplitText text={title} highlight={highlight} />
        </Heading>
        {lead ? (
          <Text tone="muted" className="mt-4">
            {lead}
          </Text>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** An eyebrow led by a short spectrum dash — the section-opening label. */
export function EyebrowDash({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Eyebrow className={cn('flex items-center gap-3', className)}>
      <span aria-hidden="true" className="h-px w-8 shrink-0 bg-(image:--gradient-spectra)" />
      {children}
    </Eyebrow>
  );
}
