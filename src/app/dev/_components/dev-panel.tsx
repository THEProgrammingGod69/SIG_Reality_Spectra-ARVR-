import type { ReactNode } from 'react';

import { Card, CardBody } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Eyebrow, Text } from '@/components/ui/text';

/**
 * Shared chrome for the /dev playgrounds (a private `_components` folder, so
 * it is never a route). Built from the real primitives, so the playgrounds
 * show the design system rather than a copy of it.
 */

export function DevPageHeader({ title, children }: { title: string; children: ReactNode }) {
  return (
    <header className="flex flex-col gap-3">
      <Eyebrow>Development only · 404 in production</Eyebrow>
      <Heading level={1}>{title}</Heading>
      <Text tone="muted" className="max-w-prose">
        {children}
      </Text>
    </header>
  );
}

export function DevPanel({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card as="section" className={className}>
      <CardBody>
        <Heading
          level={2}
          size="sm"
          className="font-mono text-label text-(--color-muted) uppercase"
        >
          {title}
        </Heading>
        <div className="mt-2">{children}</div>
      </CardBody>
    </Card>
  );
}
