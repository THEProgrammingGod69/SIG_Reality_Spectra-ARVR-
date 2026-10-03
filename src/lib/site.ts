/**
 * Single source of truth for the public sitemap.
 *
 * Every navbar link, footer link, placeholder route, `sitemap.xml` entry and
 * route smoke test reads from this file. Adding a public page means adding one
 * entry here and one `page.tsx` — nothing else has a hardcoded list of routes.
 */

/**
 * Structural constants only. The club's copy — one-liner, positioning,
 * mission, vision, about, domains, contact channels — lives in `src/content`
 * and is read through `src/lib/content.ts` (Stage 4).
 */
export const siteConfig = {
  name: 'SIG Reality Spectra',
  shortName: 'SIG Reality Spectra',
  /** Used in <title> templates, credits and structured data. */
  parentOrganisation: 'VIT Pune',
  /** What the club is, in the words used for titles and structured data. */
  kind: 'Special Interest Group',
} as const;

/** "Special Interest Group · VIT Pune" — the subtle club credit (hero, menu, footer). */
export const clubCredit = `${siteConfig.kind} · ${siteConfig.parentOrganisation}`;

/** Where a route is surfaced in the site chrome. */
export type NavPlacement = 'primary' | 'cta';

/** Footer grouping. */
export type NavGroup = 'explore' | 'involve' | 'connect';

export type SiteRoute = {
  /** URL path. Must match the folder under `src/app/(site)/`. */
  readonly href: string;
  /** Human label used in navigation. */
  readonly label: string;
  /** Page <title>. Falls back to `label` when omitted. */
  readonly title?: string;
  /** Page meta description (Home uses the content positioning line instead). */
  readonly description: string;
  readonly placement: NavPlacement;
  readonly group: NavGroup;
  /** `sitemap.xml` priority. */
  readonly priority: number;
};

/**
 * The confirmed public sitemap: six pages, no detail routes.
 *
 * Past events and their photos render inline on /events (timeline) and /gallery,
 * team members on / (core team) and /about (full hierarchy), and the sponsor
 * form lives on /contact — so no page needs a per-record URL.
 */
export const siteRoutes = [
  {
    href: '/',
    label: 'Home',
    title: 'SIG Reality Spectra',
    description: 'Who we are, what we stand for, and our ten domains.',
    placement: 'primary',
    group: 'explore',
    priority: 1,
  },
  {
    href: '/about',
    label: 'About',
    title: 'About us & team',
    description: 'About SIG Reality Spectra, its core team and the secretary of each domain.',
    placement: 'primary',
    group: 'explore',
    priority: 0.8,
  },
  {
    href: '/events',
    label: 'Events',
    description:
      'The current event with its registration link, and a timeline of every past event.',
    placement: 'primary',
    group: 'explore',
    priority: 0.9,
  },
  {
    href: '/gallery',
    label: 'Gallery',
    description: 'Photos from our hackathons, competitions, workshops and club life.',
    placement: 'primary',
    group: 'explore',
    priority: 0.7,
  },
  {
    href: '/contact',
    label: 'Contact',
    title: 'Contact & sponsorship',
    description: 'Reach the club, or send a sponsorship or collaboration request.',
    placement: 'primary',
    group: 'connect',
    priority: 0.7,
  },
  {
    href: '/recruitment',
    label: 'Recruitment',
    description:
      "Explore the club's ten domains, technical and non-technical, and apply while recruitment is open.",
    placement: 'cta',
    group: 'involve',
    priority: 0.9,
  },
] as const satisfies readonly SiteRoute[];

export type SiteRouteHref = (typeof siteRoutes)[number]['href'];

/**
 * Admin routes: the panel's navigation and page headings. Never linked from
 * the public site and always `noindex`. `/admin/login` is not listed: it is
 * outside the panel.
 */
export const adminRoutes = [
  {
    href: '/admin',
    label: 'Dashboard',
    description: 'What needs attention: upcoming events, the timeline, requests and recruitment.',
  },
  {
    href: '/admin/events',
    label: 'Events',
    description:
      'Add the current event, then complete it with a recap and photos for the timeline.',
  },
  {
    href: '/admin/gallery',
    label: 'Gallery',
    description: 'Upload standalone club photos. Photos of timeline events appear automatically.',
  },
  {
    href: '/admin/team',
    label: 'Team',
    description: 'The core team and the secretary of each domain, as shown on About.',
  },
  {
    href: '/admin/recruitment',
    label: 'Recruitment',
    description: 'Open or close recruitment, set the application form and the roles PDF.',
  },
  {
    href: '/admin/sponsorships',
    label: 'Sponsorships',
    description: 'Sponsorship and collaboration requests sent from the Contact page.',
  },
] as const;

export type AdminRouteHref = (typeof adminRoutes)[number]['href'];

export function getAdminRoute(href: AdminRouteHref) {
  // The href type guarantees a match.
  return adminRoutes.find((route) => route.href === href)!;
}

export const primaryNavRoutes = siteRoutes.filter((route) => route.placement === 'primary');
export const ctaNavRoutes = siteRoutes.filter((route) => route.placement === 'cta');

/**
 * Return types are intentionally inferred, not annotated as `SiteRoute[]`.
 * Annotating would widen `href` from its string-literal type to `string`, and
 * `typedRoutes` would then reject `<Link href={route.href}>`.
 */
export function routesInGroup(group: NavGroup) {
  return siteRoutes.filter((route) => route.group === group);
}

export function findRoute(href: string) {
  return siteRoutes.find((route) => route.href === href);
}

/**
 * Look up a route and fail loudly if it does not exist.
 *
 * Pages call this at module scope to pull their own title and description, so
 * `siteRoutes` stays the only place a page's name and copy are defined.
 */
export function getRoute<H extends SiteRouteHref>(href: H) {
  const route = siteRoutes.find((candidate) => candidate.href === href);

  if (!route) {
    throw new Error(`Unknown site route: ${href}. Add it to siteRoutes in src/lib/site.ts.`);
  }

  return route;
}

/** Page <title> for a route, falling back to its nav label. */
export function routeTitle(route: SiteRoute): string {
  return route.title ?? route.label;
}
