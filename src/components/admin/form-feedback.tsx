'use client';

import { RefreshCw, TriangleAlert } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import { Button } from '@/components/admin/ui/button';
import { Icon } from '@/components/ui/icon';
import type { ActionFailure, ActionResult } from '@/lib/action-result';

import { useToast } from './toaster';

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
 * What every form editing a stored record keeps track of (D-029): the
 * `updatedAt` it was loaded with, sent with each save and delete so a stale
 * form cannot overwrite someone else's change, and whether the last attempt
 * was refused for exactly that reason.
 */
export function useRecordVersion(initial: string | null) {
  const { toast, notify } = useToast();
  const [version, setVersion] = useState(initial);
  const [conflict, setConflict] = useState(false);

  return {
    /** The version to send with the next save or delete; null before the first save. */
    version,
    /** Show `<ConflictNotice />` while true. */
    conflict,
    /**
     * Report a save. On success: the notification and the new version, and
     * the saved record is returned. On failure: field errors (given a form's
     * `setError`), the message and the conflict notice, and null is returned.
     */
    saved<T extends { updatedAt: string }, Values extends FieldValues>(
      result: ActionResult<T>,
      success: string,
      setError?: UseFormSetError<Values>,
    ): T | null {
      setConflict(!result.ok && result.reason === 'conflict');
      if (!result.ok) {
        if (setError) reportFailure(result, setError, toast);
        else toast(result.message, 'error');
        return null;
      }
      notify(result, success);
      setVersion(result.data.updatedAt);
      return result.data;
    },
    /** Report a delete; true when it went through. */
    deleted(result: ActionResult<unknown>, success: string): boolean {
      setConflict(!result.ok && result.reason === 'conflict');
      notify(result, success);
      return result.ok;
    },
  };
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

type SaveBarProps = {
  /** Whether the record is already stored: "Save changes", or `createLabel`. */
  exists: boolean;
  /** The first save's button, e.g. "Create event". */
  createLabel: string;
  isDirty: boolean;
  isSubmitting: boolean;
  /** Usually the record's `<ConfirmDelete>`, pushed to the far end. */
  children?: ReactNode;
};

/**
 * The foot of a record editor, kept in view while the form scrolls: the save
 * button, whether anything is unsaved, and the delete action.
 */
export function SaveBar({ exists, createLabel, isDirty, isSubmitting, children }: SaveBarProps) {
  return (
    <div className="sticky bottom-0 z-10 -mx-gutter flex flex-wrap items-center gap-3 border-t bg-background px-gutter py-4 lg:-mx-10 lg:px-10">
      <Button type="submit" disabled={isSubmitting || (exists && !isDirty)}>
        {isSubmitting ? 'Saving…' : exists ? 'Save changes' : createLabel}
      </Button>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {isDirty ? 'Unsaved changes' : exists ? 'All changes saved' : ''}
      </p>
      {children ? <div className="ms-auto">{children}</div> : null}
    </div>
  );
}
