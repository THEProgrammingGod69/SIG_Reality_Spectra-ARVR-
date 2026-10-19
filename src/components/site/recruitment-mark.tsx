'use client';

import { type ReactNode, Suspense, use } from 'react';

/**
 * Shows its children only while recruitment is open. The setting reaches the
 * header as a promise (D-041): the header itself stays in the static shell, so
 * its menu works as soon as the page hydrates, and only these marks wait for
 * the data store — shown as closed until it answers.
 */
export function WhenRecruitmentOpen({
  open,
  children,
}: {
  open: Promise<boolean>;
  children: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <Mark open={open}>{children}</Mark>
    </Suspense>
  );
}

function Mark({ open, children }: { open: Promise<boolean>; children: ReactNode }) {
  return use(open) ? children : null;
}
