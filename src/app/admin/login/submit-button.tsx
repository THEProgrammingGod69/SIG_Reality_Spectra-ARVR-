'use client';

import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/admin/ui/button';

/**
 * The password form's submit button, disabled while the form is on its way:
 * a second click would only spend another of the limited attempts. Without
 * JavaScript it is a plain submit button.
 */
export function SubmitButton({
  children,
  pending: pendingLabel,
  className,
}: {
  children: ReactNode;
  /** What the button says while the sign-in is being checked. */
  pending: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className={className} disabled={pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
