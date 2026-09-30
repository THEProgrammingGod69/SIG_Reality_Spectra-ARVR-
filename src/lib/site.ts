/**
 * Single source of truth for the public sitemap.
 *
 * Every navbar link, footer link, placeholder route, `sitemap.xml` entry and
 * route smoke test reads from this file. Adding a public page means adding one
 * entry here and one `page.tsx` — nothing else has a hardcoded list of routes.
 */

export const siteConfig = {
  name: 'SIG Reality Spectra',
  shortName: 'SIG Reality Spectra',
  /** Used in <title> templates and structured data. */
  parentOrganisation: 'VIT Pune',
  tagline: 'The AR/VR/XR club of VIT Pune',
  description:
    'SIG Reality Spectra is the AR, VR and XR special interest group at VIT Pune. We run workshops, hackathons and meetups, and build extended-reality projects together.',
  /** Placeholder until the club email is confirmed. Tracked in docs/OPEN_ITEMS.md. */
  contactEmail: 'TODO@vit.edu',
  socials: {
    linkedin: 'https://www.linkedin.com/company/TODO',
    instagram: 'https://www.instagram.com/TODO',
    github: 'https://github.com/THEProgrammingGod69/SIG_Reality_Spectra-ARVR-',
  },
} as const;

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
  /** Page meta description. Also shown on the Stage 1 placeholder pages. */
  readonly description: string;
  readonly placement: NavPlacement;
  readonly group: NavGroup;
  /** `sitemap.xml` priority. Wired up in Stage 4. */
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
    description:
      'The AR/VR/XR club of VIT Pune — who we are, what we stand for, and our core team.',
    placement: 'primary',
    group: 'explore',
    priority: 1,
  },
  {
    href: '/about',
    label: 'About',
    title: 'About us & team',
    description: 'About SIG Reality Spectra and every member of the team, by role.',
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
    description: 'Photos from our workshops, hackathons, meetups and club life.',
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
    description: "Explore the club's domains and apply whenever recruitment is open.",
    placement: 'cta',
    group: 'involve',
    priority: 0.9,
  },
] as const satisfies readonly SiteRoute[];

export type SiteRouteHref = (typeof siteRoutes)[number]['href'];

/** Admin routes. Never linked from the public site and always `noindex`. */
export const adminRoutes = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/events', label: 'Events' },
  { href: '/admin/gallery', label: 'Gallery' },
  { href: '/admin/team', label: 'Team' },
  { href: '/admin/recruitment', label: 'Recruitment' },
  { href: '/admin/sponsorships', label: 'Sponsorships' },
] as const;

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
