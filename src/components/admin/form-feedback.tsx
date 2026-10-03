'use client';

import { RefreshCw, TriangleAlert } from 'lucide-react';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import { Button } from '@/components/admin/ui/button';
import { Icon } from '@/components/ui/icon';
import type { ActionFailure } from '@/lib/action-result';

/**
 * Show a failed save the same way in every admin form: each field issue beside
 * its field, the message as a notification.
 */
export function reportFailure<Values extends FieldValues>(
  failure: ActionFailure,
  setError: UseFormSetError<Values>,
  toast: (message: string, tone: 'error') => void,
) {
  for (const issue of failure.issues) {
    if (issue.path) setError(issue.path as Path<Values>, { message: issue.message });
  }
  toast(failure.message, 'error');
}

/**
 * Shown when a save was refused because someone else changed the record
 * after this form was loaded (D-029): reloading shows their version.
 */
export function ConflictNotice() {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-card border border-warning/40 p-4 sm:flex-row sm:items-center"
    >
      <Icon icon={TriangleAlert} size="md" className="text-warning" />
      <p className="flex-1 text-body-sm text-foreground">
        Someone else saved this after you opened it, so your changes were not saved. Reload to see
        their version, then make your changes again.
      </p>
      <Button type="button" variant="outline" onClick={() => window.location.reload()}>
        <Icon icon={RefreshCw} size="sm" />
        Reload
      </Button>
    </div>
  );
}
