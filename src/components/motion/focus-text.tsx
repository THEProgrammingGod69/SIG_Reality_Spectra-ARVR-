'use client';

import { motion } from 'motion/react';
import { Fragment, useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';

import { readMotionTokens, type Bezier } from '@/lib/motion/tokens';

import { prefersReducedMotion, useReducedMotion } from './use-reduced-motion';

/**
 * FocusText — our own version of React Bits' TrueFocus (D-009).
 *
 * A focus frame of four corner brackets moves from word to word while the
 * other words dim. TrueFocus blurs words with `filter` and resizes its frame
 * with `width`/`height`; this version animates only `opacity` (the words) and
 * `transform` (each corner is a fixed-size element translated to a corner of
 * the focused word), so it obeys rule 4 with no exceptions.
 *
 * The text is real text in the server HTML: the words are plain spans separated
 * by spaces, so the accessible name and the no-JS render are just the sentence.
 * The frame is decorative and hidden from assistive technology.
 *
 * Modes:
 *   once  — sweep across the words one time when `play` becomes true, then rest
 *   loop  — cycle through the words continuously
 *   hover — focus the word under the pointer
 *   none  — static text (the reduced-motion behaviour of every mode)
 */

type FocusMode = 'once' | 'loop' | 'hover' | 'none';

type FocusTextProps = {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
  id?: string;
  className?: string;
  mode?: FocusMode;
  /** For `once`: start the sweep. Turning it off ends the sweep early. */
  play?: boolean;
  /** For `once`: called after the last word. */
  onComplete?: () => void;
  /** Opacity of the words that are not in focus. */
  dimOpacity?: number;
};

const CORNERS = ['tl', 'tr', 'bl', 'br'] as const;
type Corner = (typeof CORNERS)[number];

const cornerBorders: Record<Corner, string> = {
  tl: 'border-t-2 border-l-2 rounded-tl-sm',
  tr: 'border-t-2 border-r-2 rounded-tr-sm',
  bl: 'border-b-2 border-l-2 rounded-bl-sm',
  br: 'border-b-2 border-r-2 rounded-br-sm',
};

/** Everything the frame needs to render, measured in event and timer callbacks. */
type Frame = {
  index: number | null;
  corners: Record<Corner, { x: number; y: number }> | null;
  /** 0 when the frame appears from hidden, so it jumps instead of sliding in. */
  moveSeconds: number;
  fadeSeconds: number;
  ease: Bezier | undefined;
};

const RESTING: Frame = {
  index: null,
  corners: null,
  moveSeconds: 0,
  fadeSeconds: 0,
  ease: undefined,
};

export function FocusText({
  text,
  as: Tag = 'span',
  id,
  className,
  mode = 'loop',
  play = false,
  onComplete,
  dimOpacity = 0.3,
}: FocusTextProps) {
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const cornerRef = useRef<HTMLSpanElement | null>(null);
  const reducedMotion = useReducedMotion();
  const [frame, setFrame] = useState<Frame>(RESTING);

  const effectiveMode: FocusMode = reducedMotion ? 'none' : mode;

  const focusWord = useCallback((index: number | null) => {
    const tokens = readMotionTokens();
    const word = index === null ? null : wordRefs.current[index];
    const size = cornerRef.current?.offsetWidth ?? 0;
    const pad = size / 2;

    let corners: Frame['corners'] = null;
    if (word) {
      const left = word.offsetLeft - pad;
      const top = word.offsetTop - pad;
      const right = word.offsetLeft + word.offsetWidth + pad - size;
      const bottom = word.offsetTop + word.offsetHeight + pad - size;
      corners = {
        tl: { x: left, y: top },
        tr: { x: right, y: top },
        bl: { x: left, y: bottom },
        br: { x: right, y: bottom },
      };
    }

    setFrame((previous) => ({
      index: word ? index : null,
      corners: corners ?? previous.corners,
      moveSeconds: previous.index === null ? 0 : tokens.dur.short,
      fadeSeconds: tokens.dur.short,
      ease: tokens.ease.outExpo,
    }));
  }, []);

  // Keep the frame on its word when the text reflows (resize, font swap).
  const activeIndex = frame.index;
  useEffect(() => {
    const container = wordRefs.current[0]?.parentElement;
    if (!container || activeIndex === null) return;

    const observer = new ResizeObserver(() => focusWord(activeIndex));
    observer.observe(container);
    return () => observer.disconnect();
  }, [activeIndex, focusWord]);

  // Not a dependency of the sweep: a new callback must not restart it.
  const completeSweep = useEffectEvent(() => onComplete?.());

  // `once`: step through the words, then rest with every word at full strength.
  useEffect(() => {
    if (effectiveMode !== 'once' || !play || prefersReducedMotion()) return;

    // The whole sweep fits inside one long duration (the hero's ≤ 1.5 s budget).
    const stepMs = (readMotionTokens().dur.long / wordCount) * 1000;
    const timers = Array.from({ length: wordCount }, (_, index) =>
      window.setTimeout(() => focusWord(index), index * stepMs),
    );
    const done = window.setTimeout(() => {
      focusWord(null);
      completeSweep();
    }, wordCount * stepMs);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(done);
      focusWord(null);
    };
  }, [effectiveMode, play, wordCount, focusWord]);

  // `loop`: cycle continuously, one word per long + medium duration.
  useEffect(() => {
    if (effectiveMode !== 'loop' || prefersReducedMotion()) return;

    const tokens = readMotionTokens();
    let index = 0;
    const first = window.setTimeout(() => focusWord(0), 0);
    const interval = window.setInterval(
      () => {
        index = (index + 1) % wordCount;
        focusWord(index);
      },
      (tokens.dur.long + tokens.dur.medium) * 1000,
    );

    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
      focusWord(null);
    };
  }, [effectiveMode, wordCount, focusWord]);

  const frameVisible = effectiveMode !== 'none' && frame.index !== null && frame.corners !== null;

  return (
    <Tag
      id={id}
      className={['relative', className].filter(Boolean).join(' ')}
      onPointerLeave={effectiveMode === 'hover' ? () => focusWord(null) : undefined}
    >
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <span
            ref={(node) => {
              wordRefs.current[index] = node;
            }}
            onPointerEnter={effectiveMode === 'hover' ? () => focusWord(index) : undefined}
            className="relative inline-block transition-opacity duration-(--dur-short) ease-out-expo"
            style={{ opacity: frameVisible && frame.index !== index ? dimOpacity : 1 }}
          >
            {word}
          </span>
          {index < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}

      <span aria-hidden="true" className="pointer-events-none absolute inset-0">
        {CORNERS.map((corner, index) => (
          <motion.span
            key={corner}
            ref={index === 0 ? cornerRef : undefined}
            className={`absolute top-0 left-0 size-3 border-(--color-accent) opacity-0 ${cornerBorders[corner]}`}
            initial={false}
            animate={{
              x: frame.corners?.[corner].x ?? 0,
              y: frame.corners?.[corner].y ?? 0,
              opacity: frameVisible ? 1 : 0,
            }}
            transition={{
              x: { duration: frame.moveSeconds, ease: frame.ease },
              y: { duration: frame.moveSeconds, ease: frame.ease },
              opacity: { duration: frame.fadeSeconds },
            }}
          />
        ))}
      </span>
    </Tag>
  );
}
