'use client';

import { gsap, gsapEase } from '@/lib/motion/gsap';
import { reachablePoint } from '@/lib/motion/scroll-point';
import { readCssVar, readMotionTokens, type MotionTokens } from '@/lib/motion/tokens';

/**
 * Where an entrance starts: when the element's top reaches 85% of the
 * viewport — or the bottom of the page, if the page ends before that.
 */
const ENTER_AT = 0.85;

/**
 * Plays `from` → rest on `targets` once, when `trigger` scrolls into view,
 * `--stagger` apart, on the out-expo ease.
 *
 * Content is never hidden ahead of time. Without JavaScript, or for anything
 * already on screen when the page loads, nothing animates and nothing flashes;
 * only content below the fold is set to its start state, while it is out of
 * sight. Returns the cleanup, which reverts exactly the tween and the one
 * ScrollTrigger created here — never anyone else's.
 */
function playOnceInView(
  trigger: HTMLElement,
  targets: gsap.TweenTarget,
  from: (tokens: MotionTokens) => gsap.TweenVars,
  duration: (tokens: MotionTokens) => number,
): () => void {
  if (trigger.getBoundingClientRect().top < window.innerHeight) {
    return () => {};
  }

  const tokens = readMotionTokens();
  const start = from(tokens);
  // Every property the start state names comes back to rest.
  const rest = Object.fromEntries(
    Object.keys(start).map((key) => [key, key === 'opacity' ? 1 : 0]),
  ) as gsap.TweenVars;

  const context = gsap.context(() => {
    gsap.fromTo(targets, start, {
      ...rest,
      duration: duration(tokens),
      ease: gsapEase(tokens, 'outExpo'),
      stagger: tokens.stagger,
      // Hand the element back to CSS once it has arrived.
      clearProps: 'opacity,transform',
      scrollTrigger: { trigger, start: reachablePoint(trigger, 'top', ENTER_AT), once: true },
    });
  }, trigger);

  return () => context.revert();
}

/**
 * Shared entrance used by `<Reveal>` and `<Stagger>`: fade in and rise by the
 * `--motion-rise` token.
 */
export function enterOnScroll(trigger: HTMLElement, targets: gsap.TweenTarget): () => void {
  return playOnceInView(
    trigger,
    targets,
    (tokens) => ({ opacity: 0, y: tokens.rise }),
    (tokens) => tokens.dur.medium,
  );
}

/**
 * The scroll-triggered word rise used by `<SplitText play="scroll">`: each
 * word climbs out of its line mask (`word-mask`), leaning by
 * `--motion-word-tilt` from `--motion-word-drop` below — the same start state
 * as the `word-rise` keyframes, read from the same tokens. Transform only: the
 * mask does the hiding.
 */
export function riseOnScroll(trigger: HTMLElement, targets: gsap.TweenTarget): () => void {
  return playOnceInView(
    trigger,
    targets,
    () => ({
      yPercent: parseFloat(readCssVar('--motion-word-drop')) || 0,
      rotate: parseFloat(readCssVar('--motion-word-tilt')) || 0,
    }),
    (tokens) => tokens.dur.long,
  );
}
