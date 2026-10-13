import { ScrollTrigger } from './gsap';

type Edge = 'top' | 'center' | 'bottom';

/**
 * A ScrollTrigger `start`/`end` that the reader can always reach (D-037).
 *
 * `'top 85%'` means "when the element's top reaches 85% down the viewport" —
 * but near the end of a page that moment can lie past the furthest the page
 * can scroll (a short page, the footer on a phone), and a trigger that never
 * fires leaves its element hidden for good. This returns the same point as a
 * scroll position, clamped to the page's maximum scroll, so the last element
 * on the page plays as the reader arrives at the bottom.
 *
 * Function-based, so ScrollTrigger re-measures it on every refresh (resize,
 * fonts, the hero's pin spacing).
 */
export function reachablePoint(element: Element, edge: Edge, viewportFraction: number) {
  return () => {
    const rect = element.getBoundingClientRect();
    const offset = edge === 'top' ? 0 : edge === 'center' ? rect.height / 2 : rect.height;
    const natural = rect.top + window.scrollY + offset - window.innerHeight * viewportFraction;
    // One pixel short of the end: smooth scrolling may settle a fraction shy of it.
    const reachable = Math.max(0, ScrollTrigger.maxScroll(window) - 1);
    return Math.max(0, Math.min(natural, reachable));
  };
}
