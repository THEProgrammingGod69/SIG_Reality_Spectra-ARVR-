'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/admin/ui/alert-dialog';

/**
 * The unsaved-changes guard. A form calls `useUnsavedChanges(isDirty)`; while
 * any form is dirty, closing or reloading the tab triggers the browser's own
 * warning, and leaving through the panel (its links, sign-out) asks first.
 *
 * Next.js has no API to block a client navigation, so the panel's own
 * navigation goes through `GuardedLink` and `useLeaveGuard()`.
 */

type Guard = {
  setDirty: (id: string, dirty: boolean) => void;
  /** Run `leave` now if nothing is unsaved; otherwise ask, and run it on "Leave". */
  confirmLeave: (leave: () => void) => boolean;
};

const GuardContext = createContext<Guard | null>(null);

function useGuard(): Guard {
  const guard = useContext(GuardContext);
  if (!guard) throw new Error('Needs an <UnsavedChangesProvider> (the admin panel layout)');
  return guard;
}

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [dirtyIds, setDirtyIds] = useState<ReadonlySet<string>>(() => new Set());
  const [pending, setPending] = useState<(() => void) | null>(null);
  const dirty = dirtyIds.size > 0;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const setDirty = useCallback((id: string, isDirty: boolean) => {
    setDirtyIds((current) => {
      if (current.has(id) === isDirty) return current;
      const next = new Set(current);
      if (isDirty) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const confirmLeave = useCallback(
    (leave: () => void) => {
      if (!dirty) return true;
      // Wrapped: a function passed to a state setter would be called as an updater.
      setPending(() => leave);
      return false;
    },
    [dirty],
  );

  const guard = useMemo(() => ({ setDirty, confirmLeave }), [setDirty, confirmLeave]);

  return (
    <GuardContext value={guard}>
      {children}
      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
            <AlertDialogDescription>
              Your changes on this page have not been saved. If you leave now they are lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay on this page</AlertDialogCancel>
            <AlertDialogAction
              destructive
              onClick={() => {
                const leave = pending;
                setDirtyIds(new Set());
                setPending(null);
                leave?.();
              }}
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GuardContext>
  );
}

/** Mark the calling form's unsaved state. Clears itself when the form unmounts. */
export function useUnsavedChanges(isDirty: boolean): void {
  const id = useId();
  const { setDirty } = useGuard();
  useEffect(() => {
    setDirty(id, isDirty);
    return () => setDirty(id, false);
  }, [id, isDirty, setDirty]);
}

/** For leaving by other means than a link (sign-out): returns `confirmLeave`. */
export function useLeaveGuard(): Guard['confirmLeave'] {
  return useGuard().confirmLeave;
}

type GuardedLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & { href: Route };

/** A `next/link` that asks before leaving unsaved changes. */
export function GuardedLink({ href, onClick, ...props }: GuardedLinkProps) {
  const { confirmLeave } = useGuard();
  const router = useRouter();
  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (!confirmLeave(() => router.push(href))) event.preventDefault();
      }}
      {...props}
    />
  );
}
