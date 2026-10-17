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
  const scrollRef = useRef<HTMLDivElement>(null);
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

  // Forward wheel events from header/footer to the scrollable container
  const handleDelegatedWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop += e.deltaY;
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      data-lenis-prevent
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
        'm-auto flex max-h-[90dvh] w-[calc(100%-2*var(--spacing-gutter))] max-w-lg flex-col overflow-hidden rounded-card border border-(--color-border) bg-(--color-surface) p-0 text-(--color-text-body) shadow-card overscroll-contain',
        'translate-y-(--motion-rise) opacity-0 transition-[opacity,translate,display,overlay] transition-discrete duration-(--dur-short) ease-out-expo',
        'open:translate-y-0 open:opacity-100 starting:open:translate-y-(--motion-rise) starting:open:opacity-0',
        'backdrop:bg-(--color-void)/80 backdrop:backdrop-blur-xs',
        className,
      )}
    >
      {/* Modal top navigation bar */}
      <div
        onWheel={handleDelegatedWheel}
        className="relative flex shrink-0 items-start justify-between gap-4 border-b border-(--color-border) bg-(--color-surface-raised)/80 px-5 py-4 backdrop-blur-md sm:px-6 sm:py-4.5"
      >
        {/* Subtle accent glow line at the top */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-(--color-accent)/60 to-transparent"
        />
        <div className="flex flex-col gap-1 pr-2">
          <h2 id={titleId} className="font-display text-display-sm font-semibold tracking-tight text-(--color-text)">
            {title}
          </h2>
          {description ? (
            <p id={descriptionId} className="text-body-sm text-(--color-muted) line-clamp-2">
              {description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-(--color-border-strong) bg-(--color-surface-raised) text-(--color-muted) transition-all duration-(--dur-short) ease-out-expo hover:scale-105 hover:border-(--color-accent) hover:bg-(--color-accent)/10 hover:text-(--color-accent) active:scale-95 focus-visible:outline-2 focus-visible:outline-(--color-accent)"
          aria-label="Close dialog"
        >
          <Icon icon={X} size="md" />
        </button>
      </div>

      {/* Normal scrollable content for laptop and mobile */}
      {children ? (
        <div
          ref={scrollRef}
          data-lenis-prevent
          tabIndex={0}
          className="flex-1 overflow-y-auto overscroll-contain p-5 touch-pan-y focus-visible:outline-none sm:p-6"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
      ) : null}

      {/* Modal action footer */}
      {footer ? (
        <div
          onWheel={handleDelegatedWheel}
          className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-(--color-border) bg-(--color-surface-raised)/40 px-5 py-4 backdrop-blur-md sm:px-6"
        >
          {footer}
        </div>
      ) : null}
    </dialog>
  );
}
