import type { Metadata } from 'next';

import { routeTitle, siteConfig, type SiteRoute } from './site';

/**
 * Per-page metadata, built from `siteRoutes` so every page gets the same
 * complete set: <title>, description, canonical URL, OpenGraph and Twitter.
 *
 * Next.js merges metadata shallowly — a page's `openGraph` replaces the root
 * layout's entirely — so each page must state its own; this helper is that one
 * place. Stage 9 adds the generated OpenGraph images.
 */

/** Home page and fallback title: "SIG Reality Spectra — Special Interest Group, VIT Pune". */
export const defaultTitle = `${siteConfig.name} — ${siteConfig.kind}, ${siteConfig.parentOrganisation}`;

export const titleTemplate = `%s | ${siteConfig.name}`;

export const OG_LOCALE = 'en_IN';

type PageMetadataOptions = {
  /** Replace the route's meta description (Home uses the positioning line). */
  description?: string;
};

export function pageMetadata(route: SiteRoute, options: PageMetadataOptions = {}): Metadata {
  const isHome = route.href === '/';
  const description = options.description ?? route.description;
  // The <title> gets the template suffix from the root layout; share titles spell it out.
  const shareTitle = isHome ? defaultTitle : titleTemplate.replace('%s', routeTitle(route));

  return {
    ...(isHome ? { title: { absolute: defaultTitle } } : { title: routeTitle(route) }),
    description,
    alternates: { canonical: route.href },
    openGraph: {
      type: 'website',
      siteName: siteConfig.name,
      locale: OG_LOCALE,
      url: route.href,
      title: shareTitle,
      description,
    },
    twitter: { card: 'summary_large_image', title: shareTitle, description },
  };
}
