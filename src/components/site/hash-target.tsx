'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Marks the element the URL's #fragment names with `data-targeted` (D-037),
 * so it can be styled like `:target` — which a client navigation never sets:
 * Next.js moves between pages with `history.pushState`, and only a full load
 * or a real anchor jump updates `:target`. Home's domain links land on
 * /recruitment#<domain> this way. Renders nothing; style both
 * `target:` and `data-targeted:`.
 */
export function HashTarget() {
  const pathname = usePathname();

  useEffect(() => {
    let marked: HTMLElement | null = null;
    const mark = () => {
      if (marked) delete marked.dataset.targeted;
      const id = decodeURIComponent(window.location.hash.slice(1));
      marked = id ? document.getElementById(id) : null;
      if (marked) marked.dataset.targeted = 'true';
    };

    mark();
    window.addEventListener('hashchange', mark);
    return () => {
      window.removeEventListener('hashchange', mark);
      if (marked) delete marked.dataset.targeted;
    };
  }, [pathname]);

  return null;
}
