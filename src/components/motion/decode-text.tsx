'use client';

import { useEffect, useRef } from 'react';

import { cn } from '@/lib/cn';
import { readMotionTokens } from '@/lib/motion/tokens';

import { prefersReducedMotion } from './use-reduced-motion';

/** Glyphs a character cycles through before it resolves: a HUD's readout. */
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+/<>=_';
/** Spaces and punctuation hold their place, so the line never reflows. */
const SCRAMBLES = /[\p{L}\p{N}]/u;
/** A fresh glyph every few frames: the eye reads it as decoding, not flicker. */
const FRAMES_PER_GLYPH = 3;

type DecodeTextProps = {
  /** The text. It is the element's real, readable content at every moment. */
  text: string;
  /**
   * `view` decodes once, when the text first scrolls into view; `manual`
   * decodes whenever `replay` changes (a navigation label on hover).
   */
  trigger?: 'view' | 'manual';
  /** Bump to decode again (`trigger="manual"`). */
  replay?: number;
  className?: string;
};

/**
 * DecodeText — our version of React Bits' DecryptedText (D-038), for short
 * mono labels: each character cycles through HUD glyphs and resolves left to
 * right, as a readout coming online.
 *
 * Accessible by construction. The real text never leaves the DOM: while a
 * decode runs it is only made transparent, and the glyphs play in an
 * `aria-hidden` copy laid exactly over it, so assistive technology, find in
 * page and text search always meet the real words, and the layout never
 * shifts (use it on mono type, where every glyph is the same width). Nothing
 * re-renders per frame: the copy's text is written directly.
 *
 * Nothing moves: no property animates, and on a mono grid each glyph changes
 * in place (rule 4 is about what moves; this is recorded as D-038, which
 * reverses D-037's "no scramble effects" for this construction only). It is
 * short (`--dur-medium` plus a stagger per character), runs once per trigger,
 * plays only in an `aria-hidden` copy, and under reduced motion never runs —
 * the text is simply there.
 */
export function DecodeText({ text, trigger = 'view', replay = 0, className }: DecodeTextProps) {
  const realRef = useRef<HTMLSpanElement>(null);
  const copyRef = useRef<HTMLSpanElement>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const decode = () => {
    const real = realRef.current;
    const copy = copyRef.current;
    if (!real || !copy || prefersReducedMotion()) return;

    stopRef.current?.();
    const tokens = readMotionTokens();
    const characters = Array.from(text);
    // Every character resolves in turn across the run; the last one lands at
    // `--dur-medium` plus a stagger per character, capped so long labels stay short.
    const spread = tokens.stagger * Math.min(characters.length, 16);
    const total = (tokens.dur.medium + spread) * 1000;
    if (total <= 0) return;

    let frame = 0;
    let count = 0;
    const started = performance.now();
    const glyphs = characters.map(() => '');

    const finish = () => {
      cancelAnimationFrame(frame);
      copy.textContent = '';
      real.style.opacity = '';
      stopRef.current = null;
    };

    const tick = (now: number) => {
      const progress = (now - started) / total;
      if (progress >= 1) {
        finish();
        return;
      }
      const fresh = count % FRAMES_PER_GLYPH === 0;
      count += 1;
      copy.textContent = characters
        .map((character, index) => {
          if (!SCRAMBLES.test(character)) return character;
          // Character i resolves at (i + 1) / n of the run.
          if (progress >= (index + 1) / characters.length) return character;
          if (fresh || !glyphs[index]) {
            glyphs[index] = GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!;
          }
          return glyphs[index];
        })
        .join('');
      frame = requestAnimationFrame(tick);
    };

    real.style.opacity = '0';
    frame = requestAnimationFrame(tick);
    stopRef.current = finish;
  };

  // Keep the latest `decode` for the effects below without re-arming them.
  const decodeRef = useRef(decode);
  useEffect(() => {
    decodeRef.current = decode;
  });

  useEffect(() => {
    const real = realRef.current;
    if (trigger !== 'view' || !real) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        decodeRef.current();
      }
    });
    observer.observe(real);
    return () => observer.disconnect();
  }, [trigger, text]);

  useEffect(() => {
    if (trigger === 'manual' && replay > 0) decodeRef.current();
  }, [trigger, replay]);

  useEffect(() => () => stopRef.current?.(), []);

  return (
    <span className={cn('relative inline-block', className)}>
      <span ref={realRef}>{text}</span>
      <span
        ref={copyRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 select-none"
      />
    </span>
  );
}
