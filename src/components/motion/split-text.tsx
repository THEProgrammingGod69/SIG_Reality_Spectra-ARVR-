'use client';

import { Fragment, useLayoutEffect, useRef, type CSSProperties } from 'react';

import { cn } from '@/lib/cn';

import { riseOnScroll } from './enter-on-scroll';
import { prefersReducedMotion, useReducedMotion } from './use-reduced-motion';

type SplitTextProps = {
  /** The heading's text. Every word is real text in the HTML. */
  text: string;
  /**
   * Words drawn in the spectrum gradient — one per heading at most, so the
   * spectrum stays a light, not a theme (≤ 10% of a screen). Matched by
   * word, ignoring case and punctuation.
   */
  highlight?: string;
  /**
   * `load` — plays at first paint, in CSS: the page's title, above the fold.
   * It needs no script, and replays on every client navigation (the page
   * remounts). `scroll` — plays once, when scrolled into view: section
   * headings further down.
   */
  play?: 'load' | 'scroll';
  /** Words already in motion before this text, so the stagger continues. */
  delay?: number;
};

const bare = (word: string) => word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

/**
 * SplitText — our version of React Bits' SplitText (D-037), for headings.
 *
 * Each word sits in its own line mask and climbs out of it, `--stagger`
 * apart, with a slight lean that settles as it lands. Only `transform`
 * changes (rule 4): the mask does the hiding, so no word is ever faded.
 *
 * Render it inside a heading: `<Heading level={2}><SplitText text="…" /></Heading>`.
 * The words stay ordinary text with ordinary spaces between them, so the
 * heading's accessible name and its text search are unchanged.
 *
 * Reduced motion: the delays are `--stagger` multiples and the CSS duration
 * collapses, so `load` lands at once; `scroll` does not animate at all. A
 * `scroll` heading already on screen at load is never hidden (enter-on-scroll).
 */
export function SplitText({ text, highlight, play = 'scroll', delay = 0 }: SplitTextProps) {
  const firstRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();

  const words = text.split(/\s+/).filter(Boolean);
  const marked = new Set((highlight ?? '').split(/\s+/).map(bare).filter(Boolean));

  useLayoutEffect(() => {
    const container = firstRef.current?.parentElement;
    if (play !== 'scroll' || !container || reducedMotion || prefersReducedMotion()) return;

    const inner = container.querySelectorAll<HTMLElement>(':scope > .word-mask > [data-word]');
    return riseOnScroll(container, inner);
  }, [play, reducedMotion]);

  return words.map((word, index) => {
    const style: CSSProperties | undefined =
      play === 'load' ? { animationDelay: `calc(var(--stagger) * ${index + delay})` } : undefined;
    return (
      <Fragment key={`${index}-${word}`}>
        {index > 0 ? ' ' : null}
        <span ref={index === 0 ? firstRef : undefined} className="word-mask">
          <span
            data-word
            style={style}
            className={cn(
              'inline-block',
              play === 'load' && 'animate-word-rise',
              marked.has(bare(word)) && 'text-spectra',
            )}
          >
            {word}
          </span>
        </span>
      </Fragment>
    );
  });
}
