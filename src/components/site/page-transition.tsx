'use client';

import { motion } from 'motion/react';
import { useEffect, useState, type ReactNode } from 'react';

import { useMotionTokens } from '@/components/motion/use-motion-tokens';

/** Becomes true after the first page has hydrated; later pages are navigations. */
const session = { hydrated: false };

/**
 * Route change fade, rendered by `(site)/template.tsx` (a template remounts on
 * every navigation, a layout does not).
 *
 * Opacity only — no transform on this wrapper, because a transformed ancestor
 * would break the hero's pinned (position: fixed) scroll-out. The first page
 * load never fades: the hero name must be visible at first paint (D-010), so
 * only client-side navigations animate. Under reduced motion the duration
 * token is zero.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const tokens = useMotionTokens();
  // Decided once per mount; false during hydration so server and client agree.
  const [animate] = useState(() => typeof window !== 'undefined' && session.hydrated);

  useEffect(() => {
    session.hydrated = true;
  }, []);

  return (
    <motion.div
      initial={animate ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: tokens?.dur.short ?? 0, ease: tokens?.ease.outExpo }}
    >
      {children}
    </motion.div>
  );
}
