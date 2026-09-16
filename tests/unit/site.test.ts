import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  adminRoutes,
  ctaNavRoutes,
  dynamicRouteTemplates,
  getRoute,
  primaryNavRoutes,
  siteConfig,
  siteRoutes,
} from '@/lib/site';

const APP_SITE_DIR = join(process.cwd(), 'src', 'app', '(site)');
const APP_ADMIN_DIR = join(process.cwd(), 'src', 'app', 'admin');

/** `/about` -> `src/app/(site)/about/page.tsx`; `/` -> `src/app/(site)/page.tsx`. */
function pageFileFor(href: string): string {
  const segments = href.split('/').filter(Boolean);
  return join(APP_SITE_DIR, ...segments, 'page.tsx');
}

function fileExists(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

describe('siteConfig', () => {
  it('has the club name and tagline filled in', () => {
    expect(siteConfig.name).toBe('SIG Reality Spectra');
    expect(siteConfig.tagline.length).toBeGreaterThan(0);
    expect(siteConfig.description.length).toBeGreaterThan(50);
  });
});

describe('siteRoutes', () => {
  it('declares the eleven confirmed public pages', () => {
    expect(siteRoutes).toHaveLength(11);
  });

  it('has no duplicate hrefs', () => {
    const hrefs = siteRoutes.map((route) => route.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('uses root-relative hrefs with no trailing slash', () => {
    for (const route of siteRoutes) {
      expect(route.href.startsWith('/')).toBe(true);
      if (route.href !== '/') {
        expect(route.href.endsWith('/')).toBe(false);
      }
    }
  });

  it('gives every route a label and a usable meta description', () => {
    for (const route of siteRoutes) {
      expect(route.label.trim().length).toBeGreaterThan(0);
      expect(route.description.trim().length).toBeGreaterThanOrEqual(20);
      expect(route.description.length).toBeLessThanOrEqual(160);
    }
  });

  it('keeps the primary navigation shallow enough for a 360px phone', () => {
    // Five primary links plus one call to action. More than this and the
    // Stage 3 navbar stops fitting without a hamburger on tablet widths.
    expect(primaryNavRoutes.length).toBeLessThanOrEqual(5);
    expect(ctaNavRoutes).toHaveLength(1);
    expect(ctaNavRoutes[0]?.href).toBe('/join');
  });

  it('has a page.tsx on disk for every declared route', () => {
    for (const route of siteRoutes) {
      const file = pageFileFor(route.href);
      expect(fileExists(file), `missing page file for ${route.href}: ${file}`).toBe(true);
    }
  });

  it('declares every public page that exists on disk', () => {
    const declared = new Set<string>(siteRoutes.map((route) => route.href));
    const onDisk = readdirSync(APP_SITE_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('['))
      .map((entry) => `/${entry.name}`);

    for (const href of onDisk) {
      expect(declared.has(href), `${href} exists on disk but is not in siteRoutes`).toBe(true);
    }
  });
});

describe('dynamicRouteTemplates', () => {
  it('has a page.tsx for every detail template', () => {
    for (const template of dynamicRouteTemplates) {
      const segments = template.pattern.split('/').filter(Boolean);
      const file = join(APP_SITE_DIR, ...segments, 'page.tsx');
      expect(fileExists(file), `missing ${file}`).toBe(true);
    }
  });
});

describe('adminRoutes', () => {
  it('has a page.tsx for every admin route', () => {
    for (const route of adminRoutes) {
      const segments = route.href.split('/').filter(Boolean).slice(1);
      const file = join(APP_ADMIN_DIR, ...segments, 'page.tsx');
      expect(fileExists(file), `missing ${file}`).toBe(true);
    }
  });

  it('keeps every admin route under /admin', () => {
    for (const route of adminRoutes) {
      expect(route.href.startsWith('/admin')).toBe(true);
    }
  });
});

describe('getRoute', () => {
  it('returns the matching route', () => {
    expect(getRoute('/projects').label).toBe('Projects');
  });

  it('throws a named error for an unknown route', () => {
    // @ts-expect-error — deliberately passing an href that is not in the union.
    expect(() => getRoute('/nope')).toThrowError(/Unknown site route/);
  });
});
