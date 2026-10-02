'use client';

import { gsap, gsapEase } from '@/lib/motion/gsap';
import { readMotionTokens } from '@/lib/motion/tokens';

/** Where an entrance starts: when the element's top reaches 85% of the viewport. */
const ENTER_START = 'top 85%';

/**
 * Shared entrance used by `<Reveal>` and `<Stagger>`: fade in and rise by the
 * `--motion-rise` token, once, when `trigger` scrolls into view.
 *
 * Content is never hidden ahead of time. Without JavaScript, or for anything
 * already on screen when the page loads, nothing animates and nothing flashes;
 * only content below the fold is set to its start state, while it is out of
 * sight. Returns the cleanup, which reverts exactly the tween and the one
 * ScrollTrigger created here — never anyone else's.
 */
export function enterOnScroll(trigger: HTMLElement, targets: gsap.TweenTarget): () => void {
  if (trigger.getBoundingClientRect().top < window.innerHeight) {
    return () => {};
  }

  const tokens = readMotionTokens();

  const context = gsap.context(() => {
    gsap.fromTo(
      targets,
      { opacity: 0, y: tokens.rise },
      {
        opacity: 1,
        y: 0,
        duration: tokens.dur.medium,
        ease: gsapEase(tokens, 'outExpo'),
        stagger: tokens.stagger,
        // Hand the element back to CSS once it has arrived.
        clearProps: 'opacity,transform',
        scrollTrigger: { trigger, start: ENTER_START, once: true },
      },
    );
  }, trigger);

  return () => context.revert();
}
