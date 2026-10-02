'use client';

import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';

import { lockScroll } from '@/components/motion/scroll-lock';
import { cn } from '@/lib/cn';

import { Icon } from './icon';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Actions row (e.g. Cancel / Confirm). */
  footer?: ReactNode;
  className?: string;
};

/**
 * Accessible dialog on the native `<dialog>` element: `showModal()` gives the
 * focus trap, Escape to close, an inert page behind it and focus returned to
 * the opener for free, and it renders in the top layer above every z-index.
 *
 * Enter and exit fade and rise with `opacity` and `translate` only (rule 4),
 * on the short duration token. Clicking the backdrop closes it. The page
 * behind is scroll-locked, including Lenis.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;

    dialog.showModal();
    const release = lockScroll();
    return () => {
      release();
      if (dialog.open) dialog.close();
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      // Escape: let the parent own the state instead of the browser.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // A click on the dialog element itself (not its content) is the backdrop.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        'm-auto w-[calc(100%-2*var(--spacing-gutter))] max-w-lg rounded-card border border-(--color-border) bg-(--color-surface) p-0 text-(--color-text-body) shadow-card',
        'translate-y-(--motion-rise) opacity-0 transition-[opacity,translate,display,overlay] transition-discrete duration-(--dur-short) ease-out-expo',
        'open:translate-y-0 open:opacity-100 starting:open:translate-y-(--motion-rise) starting:open:opacity-0',
        'backdrop:bg-(--color-void)/70',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 p-6 pb-0">
        <div className="flex flex-col gap-2">
          <h2 id={titleId} className="font-display text-display-sm">
            {title}
          </h2>
          {description ? (
            <p id={descriptionId} className="text-body-sm text-(--color-muted)">
              {description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="-m-2 inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-(--color-muted) hover:text-(--color-text)"
        >
          <Icon icon={X} size="md" label="Close dialog" />
        </button>
      </div>
      {children ? <div className="p-6">{children}</div> : null}
      {footer ? (
        <div className="flex flex-wrap justify-end gap-3 border-t border-(--color-border) p-6">
          {footer}
        </div>
      ) : null}
    </dialog>
  );
}
