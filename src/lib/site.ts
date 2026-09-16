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
    'SIG Reality Spectra is the AR, VR and XR special interest group at VIT Pune. We build real extended-reality projects, run workshops and events, and showcase what our members ship.',
  /** Placeholder until the club email is confirmed. Tracked in docs/OPEN_ITEMS.md. */
  contactEmail: 'TODO@vit.edu',
  socials: {
    linkedin: 'https://www.linkedin.com/company/TODO',
    instagram: 'https://www.instagram.com/TODO',
    github: 'https://github.com/THEProgrammingGod69/SIG_Reality_Spectra-ARVR-',
  },
} as const;

/** Where a route is surfaced in the site chrome. */
export type NavPlacement = 'primary' | 'cta' | 'footer';

/** Footer grouping. Primary-nav routes also carry a group so the footer can list everything. */
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
 * The confirmed public sitemap.
 *
 * Eleven public pages plus three detail-page templates. Navigation is
 * deliberately shallow: five primary links and one call to action, with the
 * long tail in the footer, so the navbar still works on a 360px phone.
 */
export const siteRoutes = [
  {
    href: '/',
    label: 'Home',
    title: 'SIG Reality Spectra',
    description: 'The AR/VR/XR club of VIT Pune — what we build, run and ship.',
    placement: 'primary',
    group: 'explore',
    priority: 1,
  },
  {
    href: '/about',
    label: 'About',
    description: 'Who we are, what the club does, and how we work.',
    placement: 'primary',
    group: 'explore',
    priority: 0.8,
  },
  {
    href: '/projects',
    label: 'Projects',
    description: 'Extended-reality projects built by club members.',
    placement: 'primary',
    group: 'explore',
    priority: 0.9,
  },
  {
    href: '/events',
    label: 'Events',
    description: 'Upcoming and past workshops, sessions and showcases.',
    placement: 'primary',
    group: 'explore',
    priority: 0.9,
  },
  {
    href: '/team',
    label: 'Team',
    description: 'The current core team and alumni of SIG Reality Spectra.',
    placement: 'primary',
    group: 'explore',
    priority: 0.7,
  },
  {
    href: '/join',
    label: 'Join Us',
    description: 'How to join SIG Reality Spectra and why members stay.',
    placement: 'cta',
    group: 'involve',
    priority: 0.9,
  },
  {
    href: '/achievements',
    label: 'Achievements',
    description: 'Competition results, recognitions and milestones, by academic year.',
    placement: 'footer',
    group: 'explore',
    priority: 0.6,
  },
  {
    href: '/gallery',
    label: 'Gallery',
    description: 'Photos from club events, builds and demo days.',
    placement: 'footer',
    group: 'explore',
    priority: 0.6,
  },
  {
    href: '/resources',
    label: 'Resources',
    description: 'Learning material, tooling and reading for getting into XR.',
    placement: 'footer',
    group: 'involve',
    priority: 0.5,
  },
  {
    href: '/collaborate',
    label: 'Collaborate',
    title: 'Collaborate & Sponsor',
    description: 'Partner with or sponsor SIG Reality Spectra.',
    placement: 'footer',
    group: 'involve',
    priority: 0.7,
  },
  {
    href: '/contact',
    label: 'Contact',
    description: 'Reach the club committee.',
    placement: 'footer',
    group: 'connect',
    priority: 0.5,
  },
] as const satisfies readonly SiteRoute[];

export type SiteRouteHref = (typeof siteRoutes)[number]['href'];

/**
 * Detail-page templates. They render one record each and are filled in later
 * (projects and gallery in Stage 4, events in Stage 7), so they are listed
 * separately from the fixed pages above.
 */
export const dynamicRouteTemplates = [
  { pattern: '/projects/[slug]', sampleHref: '/projects/sample-project', label: 'Project detail' },
  { pattern: '/events/[slug]', sampleHref: '/events/sample-event', label: 'Event detail' },
  { pattern: '/gallery/[album]', sampleHref: '/gallery/sample-album', label: 'Gallery album' },
] as const;

/** Admin routes. Never linked from the public site and always `noindex`. */
export const adminRoutes = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/events', label: 'Events' },
  { href: '/admin/recruitment', label: 'Recruitment' },
  { href: '/admin/enquiries', label: 'Enquiries' },
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
