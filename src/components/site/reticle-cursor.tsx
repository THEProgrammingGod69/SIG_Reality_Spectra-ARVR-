'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { prefersReducedMotion, useReducedMotion } from '@/components/motion/use-reduced-motion';
import { readCssVar, readMotionTokens, parseLength } from '@/lib/motion/tokens';

/** What the reticle locks onto: everything a visitor can act on. */
const TARGETS = [
  'a[href]',
  'button:not([disabled])',
  '[role="button"]',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'summary',
  '[data-reticle]',
].join(',');

/** Fine pointer that hovers: a mouse or trackpad, never touch or pen. */
const MOUSE = '(pointer: fine) and (hover: hover)';

/** The four corners, in drawing order: top-left, top-right, bottom-right, bottom-left. */
const CORNERS = [
  'border-t border-l',
  'border-t border-r',
  'border-b border-r',
  'border-b border-l',
] as const;

type Point = { x: number; y: number };

/**
 * The XR targeting reticle (D-038) — our version of React Bits' TargetCursor.
 *
 * Four corner brackets wait, folded at the pointer. Over anything a visitor
 * can act on — a link, a button, a field — they fly out and lock onto its
 * edges, and fold back when the pointer moves on: the lab's headset marking
 * what is in reach. Pressing tightens the lock.
 *
 * Changed from the original, which hid the system cursor, spun forever and
 * tweened every corner with GSAP on every move:
 *   - the system cursor stays: the reticle only marks targets, so pointing
 *     works exactly as it always does;
 *   - nothing spins or moves on its own (WCAG 2.2.2): it follows the hand;
 *   - the corners are written as `transform` once per animation frame and
 *     eased toward their goal on the `--dur-micro` token; the loop stops as
 *     soon as they arrive;
 *   - decoration only: `aria-hidden`, no pointer events, so it never takes a
 *     click, and a keyboard visitor sees the ordinary focus ring;
 *   - mouse only, never under reduced motion, and never on touch screens.
 */
export function ReticleCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const releaseRef = useRef<() => void>(() => {});
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion || prefersReducedMotion()) return;
    const media = window.matchMedia(MOUSE);
    if (!media.matches) return;

    const corners = Array.from(root.querySelectorAll<HTMLElement>('[data-corner]'));
    const tokens = readMotionTokens();
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const arm = parseLength(readCssVar('--reticle-size'), rootFontSize);
    const reach = parseLength(readCssVar('--reticle-reach'), rootFontSize);
    // Time constant of the ease toward the goal: arrival in about `--dur-micro`.
    const tau = Math.max(tokens.dur.micro / 3, 0.001);

    // Off screen until the pointer first moves.
    const away = (): Point => ({ x: -window.innerWidth, y: -window.innerHeight });
    const current: Point[] = corners.map(away);
    let pointer: Point | null = null;
    let target: Element | null = null;
    let pressed = false;
    let visible = false;
    let frame = 0;
    let last = 0;

    const show = (next: boolean) => {
      if (visible === next) return;
      visible = next;
      root.dataset.locked = next ? 'true' : 'false';
    };

    /** Where each corner's top-left belongs right now. */
    const goals = (): Point[] => {
      if (target && target.isConnected) {
        const rect = target.getBoundingClientRect();
        const pad = pressed ? reach / 2 : reach;
        const left = rect.left - pad;
        const top = rect.top - pad;
        const right = rect.right + pad - arm;
        const bottom = rect.bottom + pad - arm;
        return [
          { x: left, y: top },
          { x: right, y: top },
          { x: right, y: bottom },
          { x: left, y: bottom },
        ];
      }
      // Folded at the pointer, a small square around its tip.
      const p = pointer ?? away();
      const half = arm / 2;
      return [
        { x: p.x - arm - half, y: p.y - arm - half },
        { x: p.x + half, y: p.y - arm - half },
        { x: p.x + half, y: p.y + half },
        { x: p.x - arm - half, y: p.y + half },
      ];
    };

    const render = (now: number) => {
      frame = 0;
      // A target that left the page (a navigation replaced it): let go.
      if (target && !target.isConnected) {
        target = null;
        show(false);
      }
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60;
      last = now;
      const blend = 1 - Math.exp(-dt / tau);
      const goal = goals();
      let moving = false;
      corners.forEach((corner, index) => {
        const from = current[index]!;
        const to = goal[index]!;
        from.x += (to.x - from.x) * blend;
        from.y += (to.y - from.y) * blend;
        if (Math.abs(to.x - from.x) > 0.25 || Math.abs(to.y - from.y) > 0.25) moving = true;
        else Object.assign(from, to);
        corner.style.transform = `translate3d(${from.x}px, ${from.y}px, 0)`;
      });
      if (moving) frame = requestAnimationFrame(render);
      else last = 0;
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(render);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const first = pointer === null;
      pointer = { x: event.clientX, y: event.clientY };
      if (first) {
        // Arrive folded at the pointer, not flying in from a corner of the screen.
        const start = goals();
        current.forEach((point, index) => Object.assign(point, start[index]));
      }
      schedule();
    };
    const onOver = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const found = event.target instanceof Element ? event.target.closest(TARGETS) : null;
      // `inert` content (the page behind an open menu) cannot be acted on.
      target = found && !found.closest('[inert]') ? found : null;
      show(target !== null);
      schedule();
    };
    const onLeaveWindow = (event: PointerEvent) => {
      if (event.relatedTarget === null) {
        target = null;
        show(false);
      }
    };
    const onDown = () => {
      pressed = true;
      schedule();
    };
    const onUp = () => {
      pressed = false;
      schedule();
    };
    // A locked target moves with the page: follow it.
    const onScroll = () => {
      if (target) schedule();
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('pointerout', onLeaveWindow, { passive: true });
    document.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    root.hidden = false;
    releaseRef.current = () => {
      target = null;
      show(false);
      schedule();
    };

    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerout', onLeaveWindow);
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerup', onUp);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
      root.hidden = true;
      root.dataset.locked = 'false';
      releaseRef.current = () => {};
    };
  }, [reducedMotion]);

  // A navigation replaces what the reticle was locked onto: let go.
  useEffect(() => releaseRef.current(), [pathname]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-reticle-cursor
      data-locked="false"
      hidden
      className="group/reticle pointer-events-none fixed inset-0 z-(--z-cursor) text-(--color-spectra-cyan) opacity-0 transition-opacity duration-(--dur-short) ease-out-expo data-[locked=true]:opacity-100"
    >
      {CORNERS.map((sides) => (
        <span
          key={sides}
          data-corner
          className={`hud-corner top-0 left-0 ${sides} will-change-transform`}
          style={{ transform: 'translate3d(-100vw, -100vh, 0)' }}
        />
      ))}
    </div>
  );
}
