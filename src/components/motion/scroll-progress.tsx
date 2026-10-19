'use client';

import { useEffect, useRef } from 'react';

import { cn } from '@/lib/cn';

/**
 * A hairline of spectrum light that grows across its parent as the page is
 * read (D-037) — the site header's lower edge. `scaleX` from the left, so
 * only `transform` changes (rule 4), written once per animation frame from
 * the scroll position.
 *
 * It follows the reader rather than playing on its own, so it stays under
 * reduced motion: there it simply tracks native scrolling. Hidden at the top
 * of the page (nothing read yet) and on pages too short to scroll.
 */
export function ScrollProgress({ className }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const bar = ref.current;
    if (!bar) return;

    let frame = 0;
    const apply = () => {
      frame = 0;
      const root = document.documentElement;
      const scrollable = root.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      bar.style.transform = `scaleX(${progress})`;
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      // Inline, not `scale-x-0`: Tailwind's scale utilities set the separate
      // `scale` property, which would multiply with this transform.
      style={{ transform: 'scaleX(0)' }}
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left bg-(image:--gradient-spectra)',
        className,
      )}
    />
  );
}
