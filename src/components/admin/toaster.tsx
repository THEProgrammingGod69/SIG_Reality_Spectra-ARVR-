'use client';

import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

import { useMotionTokens } from '@/components/motion/use-motion-tokens';
import type { ActionFailure, ActionResult } from '@/lib/action-result';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/cn';
import { parseDuration } from '@/lib/motion/tokens';

/**
 * Admin notifications (D-030). Built here rather than vendoring sonner, whose
 * stack animates `height` (rule 4): entrances move with transform and opacity
 * from the motion tokens, and are instant under reduced motion.
 *
 * Successes leave after `--dur-toast`; errors stay until dismissed, so a
 * failed save is never missed.
 */

export type ToastTone = 'success' | 'error' | 'info';
/** A next step offered in the notification, e.g. signing in again. */
export type ToastLink = { href: string; label: string };
export type Toast = { id: number; tone: ToastTone; message: string; link?: ToastLink };

/**
 * Offered when a save failed because the session ended (`signed-out`). It
 * opens the sign-in page in a new tab, so the form — and everything typed
 * into it — is still here to save again once the admin has signed in.
 */
export const SIGN_IN_AGAIN: ToastLink = {
  href: '/admin/login',
  label: 'Sign in again (opens a new tab)',
};

/** The link a failed Server Action's notification offers, if any. */
export function failureLink(failure: ActionFailure): ToastLink | undefined {
  return failure.reason === 'signed-out' ? SIGN_IN_AGAIN : undefined;
}

type ToastAction = { type: 'add'; toast: Toast } | { type: 'dismiss'; id: number };

/** Keeps the newest few; older ones are dropped rather than piling up. */
export const MAX_TOASTS = 4;

export function toastReducer(toasts: readonly Toast[], action: ToastAction): Toast[] {
  if (action.type === 'dismiss') return toasts.filter((toast) => toast.id !== action.id);
  return [...toasts, action.toast].slice(-MAX_TOASTS);
}

type ToastApi = {
  toast: (message: string, tone?: ToastTone, link?: ToastLink) => void;
  /** Report a failed admin Server Action: its message, and a way to sign in if signed out. */
  fail: (failure: ActionFailure) => void;
  /** Report an admin Server Action's result: its error, or `success`. */
  notify: (result: ActionResult<unknown>, success: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast() needs a <ToastProvider> (the admin panel layout)');
  return api;
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);

  const toast = useCallback((message: string, tone: ToastTone = 'info', link?: ToastLink) => {
    dispatch({ type: 'add', toast: { id: (nextId += 1), tone, message, link } });
  }, []);
  const dismiss = useCallback((id: number) => dispatch({ type: 'dismiss', id }), []);

  const api = useMemo<ToastApi>(() => {
    const fail = (failure: ActionFailure) => toast(failure.message, 'error', failureLink(failure));
    return {
      toast,
      fail,
      notify: (result, success) => (result.ok ? toast(success, 'success') : fail(result)),
    };
  }, [toast]);

  return (
    <ToastContext value={api}>
      {children}
      <ol
        aria-label="Notifications"
        className="pointer-events-none fixed right-4 bottom-4 z-(--z-toast) flex w-[min(24rem,calc(100%-2rem))] flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {toasts.map((item) => (
            <ToastItem key={item.id} toast={item} dismiss={dismiss} />
          ))}
        </AnimatePresence>
      </ol>
    </ToastContext>
  );
}

const TONES = {
  success: { icon: CircleCheck, className: 'text-success' },
  error: { icon: CircleAlert, className: 'text-destructive' },
  info: { icon: Info, className: 'text-primary' },
} as const;

function ToastItem({ toast, dismiss }: { toast: Toast; dismiss: (id: number) => void }) {
  const tokens = useMotionTokens();
  const tone = TONES[toast.tone];

  useEffect(() => {
    if (toast.tone === 'error') return;
    const lifetime = parseDuration(
      getComputedStyle(document.documentElement).getPropertyValue('--dur-toast'),
    );
    const timer = window.setTimeout(() => dismiss(toast.id), lifetime * 1000);
    return () => window.clearTimeout(timer);
  }, [toast.id, toast.tone, dismiss]);

  return (
    <motion.li
      initial={{ opacity: 0, y: tokens?.rise ?? 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: tokens?.dur.short ?? 0, ease: tokens?.ease.outExpo }}
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className="pointer-events-auto flex items-start gap-3 rounded-card border bg-popover p-4 text-body-sm text-popover-foreground shadow-card"
    >
      <Icon icon={tone.icon} size="sm" className={cn('mt-0.5', tone.className)} />
      <div className="flex flex-1 flex-col gap-1">
        <p>{toast.message}</p>
        {toast.link ? (
          // A plain link in a new tab, not a client navigation: the panel's
          // session is gone, and this tab keeps the unsaved form.
          <a
            href={toast.link.href}
            target="_blank"
            rel="noopener"
            className="self-start font-medium text-foreground underline underline-offset-4"
          >
            {toast.link.label}
          </a>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        className="rounded-control text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Icon icon={X} size="sm" />
        <span className="sr-only">Dismiss</span>
      </button>
    </motion.li>
  );
}
