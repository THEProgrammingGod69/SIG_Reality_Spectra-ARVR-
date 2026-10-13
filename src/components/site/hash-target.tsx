'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/** The fragment's id, decoded — or as written, if it is not valid percent-encoding. */
function fragmentId(): string {
  const raw = window.location.hash.slice(1);
  try {
    return decodeURIComponent(raw);
  } catch {
    // A mangled link (`#%`, `#100%`) must never take the page down.
    return raw;
  }
}

/**
 * Marks the element the URL's #fragment names with `data-targeted` (D-037),
 * so it can be styled like `:target` — which a client navigation never sets:
 * Next.js moves between pages with `history.pushState`, and only a full load
 * or a real anchor jump updates `:target`. Home's domain links land on
 * /recruitment#<domain> this way. Renders nothing; style both
 * `target:` and `data-targeted:`.
 *
 * The mark follows the URL: on mount and route change, on hash changes and
 * history traversal, and — where the browser has the Navigation API — on a
 * client navigation within the same page (a link to /recruitment from
 * /recruitment#xr-development), which fires neither of those events.
 */
export function HashTarget() {
  const pathname = usePathname();

  useEffect(() => {
    let marked: HTMLElement | null = null;
    const mark = () => {
      if (marked) delete marked.dataset.targeted;
      const id = fragmentId();
      marked = id ? document.getElementById(id) : null;
      if (marked) marked.dataset.targeted = 'true';
    };

    const navigation = (window as Window & { navigation?: EventTarget }).navigation;
    mark();
    window.addEventListener('hashchange', mark);
    window.addEventListener('popstate', mark);
    navigation?.addEventListener('currententrychange', mark);
    return () => {
      window.removeEventListener('hashchange', mark);
      window.removeEventListener('popstate', mark);
      navigation?.removeEventListener('currententrychange', mark);
      if (marked) delete marked.dataset.targeted;
    };
  }, [pathname]);

  return null;
}
