import Link from 'next/link';

import { SmoothScroll } from '@/components/motion/smooth-scroll';
import { ctaNavRoutes, primaryNavRoutes, routesInGroup, siteConfig } from '@/lib/site';

/**
 * Public site shell.
 *
 * The navigation and footer below are TEMPORARY Stage 1 scaffolding: they exist
 * so every route is reachable and the smoke tests are meaningful. Stage 3
 * replaces them with the real Navbar (sticky, blur on scroll, animated mobile
 * menu) and Footer, built on the design system. Stage 8 adds the "recruitment
 * open" state to the Recruitment call to action.
 *
 * What is NOT temporary, and must survive Stage 3:
 *   - the skip link and the single <main id="main-content"> landmark
 *   - links being driven by `siteRoutes`, never hardcoded in the shell
 *   - <SmoothScroll />: Lenis runs on the public site only; the admin panel
 *     keeps native scrolling (micro-interactions only, no ambient motion)
 */

const footerGroups = [
  { id: 'explore', heading: 'Explore' },
  { id: 'involve', heading: 'Get involved' },
  { id: 'connect', heading: 'Connect' },
] as const;

export default function SiteLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <SmoothScroll />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-(--color-accent) focus:px-4 focus:py-2 focus:text-(--color-accent-contrast)"
      >
        Skip to content
      </a>

      <header className="border-b border-(--color-border)">
        <nav
          aria-label="Primary"
          className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4"
        >
          <Link href="/" className="font-semibold tracking-tight">
            {siteConfig.name}
          </Link>

          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            {primaryNavRoutes
              .filter((route) => route.href !== '/')
              .map((route) => (
                <li key={route.href}>
                  <Link
                    href={route.href}
                    className="text-(--color-muted) hover:text-(--color-text)"
                  >
                    {route.label}
                  </Link>
                </li>
              ))}
          </ul>

          <ul className="ms-auto flex items-center gap-3 text-sm">
            {ctaNavRoutes.map((route) => (
              <li key={route.href}>
                <Link
                  href={route.href}
                  className="rounded-full bg-(--color-accent) px-4 py-1.5 font-medium text-(--color-accent-contrast)"
                >
                  {route.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-(--color-border)">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
          {footerGroups.map((group) => (
            <nav key={group.id} aria-label={group.heading}>
              <h2 className="text-xs font-semibold tracking-widest text-(--color-muted) uppercase">
                {group.heading}
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {routesInGroup(group.id).map((route) => (
                  <li key={route.href}>
                    <Link
                      href={route.href}
                      className="text-(--color-muted) hover:text-(--color-text)"
                    >
                      {route.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mx-auto w-full max-w-6xl px-6 pb-10 text-xs text-(--color-muted)">
          {siteConfig.name} — {siteConfig.tagline}
        </div>
      </footer>
    </>
  );
}
