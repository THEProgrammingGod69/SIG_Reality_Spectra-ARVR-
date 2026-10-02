import { cn } from '@/lib/cn';

/**
 * Loading placeholder. Size it with classes (`h-4 w-1/2`, `aspect-video`).
 * The shimmer is a faint band of spectrum light (10%) moving with `transform`;
 * under reduced motion it stands still.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative overflow-hidden rounded-control bg-(--color-surface-raised)',
        className,
      )}
    >
      <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(90deg,transparent,color-mix(in_oklab,var(--color-accent)_10%,transparent),transparent)]" />
    </div>
  );
}
