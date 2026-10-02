import { expect, test } from '@playwright/test';

import contact from '@/content/contact.json';
import domains from '@/content/domains.json';
import recruitment from '@/content/recruitment.json';
import site from '@/content/site.json';
import { siteConfig, siteRoutes } from '@/lib/site';

/**
 * Stage 4 acceptance: the Git-edited content reaches its pages, placeholders
 * are honest, QR codes appear where they help, and SEO is complete. Expected
 * values are read from src/content, so editing the copy never breaks a test.
 */

const liveSocials = contact.socials.filter((s) => s.href !== null);

test.describe('home', () => {
  test('tells the club story from the content files', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText(site.tagline).first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Who we are' })).toBeVisible();
    await expect(page.getByText(site.about.short)).toBeVisible();
    await expect(page.getByText(site.mission)).toBeVisible();
    await expect(page.getByText(site.vision)).toBeVisible();
  });

  test('has no team section: the team is on About only (D-027)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /team/i })).toHaveCount(0);
  });

  test('lists every domain by name and links to the full descriptions', async ({ page }) => {
    await page.goto('/');
    const overview = page.locator('section[aria-labelledby="domains-overview"]');

    for (const domain of domains) await expect(overview).toContainText(domain.name);
    await expect(overview.getByRole('link', { name: 'Explore the domains' })).toHaveAttribute(
      'href',
      '/recruitment#domains',
    );
  });

  test('publishes the club as schema.org structured data', async ({ page }) => {
    await page.goto('/');
    const json = await page.locator('script[type="application/ld+json"]').textContent();
    const data = JSON.parse(json ?? '{}') as Record<string, unknown>;

    expect(data['@type']).toBe('Organization');
    expect(data['name']).toBe(siteConfig.name);
    expect(data['slogan']).toBe(site.motto);
  });
});

test.describe('about', () => {
  test('shows the long story, the facts and the team section', async ({ page }) => {
    await page.goto('/about');

    for (const paragraph of site.about.long) await expect(page.getByText(paragraph)).toBeVisible();
    await expect(page.getByText('3 technical · 7 non-technical')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'The team' })).toBeVisible();
  });
});

test.describe('recruitment', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('offers the application form while open, with a QR code', async ({ page }) => {
    await page.goto('/recruitment');
    test.skip(!recruitment.open, 'Recruitment is closed in src/content/recruitment.json');

    const apply = page.getByRole('link', { name: /Apply now/ });
    await expect(apply).toHaveAttribute('href', recruitment.formUrl!);
    await expect(apply).toHaveAttribute('target', '_blank');
    await expect(apply).toHaveAttribute('rel', /noopener/);
    await expect(page.getByRole('img', { name: 'QR code for the application form' })).toBeVisible();
    await expect(
      page.getByRole('banner').getByRole('link', { name: /Recruitment \(open now\)/ }),
    ).toBeVisible();
  });

  test('links the roles PDF, or says plainly that it is coming (D-028)', async ({ page }) => {
    await page.goto('/recruitment');
    test.skip(!recruitment.open, 'Recruitment is closed in src/content/recruitment.json');

    const pdf = page.getByRole('link', { name: /Roles & responsibilities \(PDF\)/ });
    if ('rolesPdfUrl' in recruitment && typeof recruitment.rolesPdfUrl === 'string') {
      await expect(pdf).toHaveAttribute('href', recruitment.rolesPdfUrl);
    } else {
      await expect(pdf).toHaveCount(0);
      await expect(
        page.getByText('The roles and responsibilities document is coming soon.'),
      ).toBeVisible();
    }
  });

  test('shows every domain with its full description, in both groups', async ({ page }) => {
    await page.goto('/recruitment');

    for (const group of ['Technical', 'Non-technical']) {
      await expect(page.getByRole('heading', { level: 3, name: group, exact: true })).toBeVisible();
    }
    for (const domain of domains) {
      await expect(page.locator(`#${domain.id}`)).toContainText(domain.description);
    }
  });
});

test.describe('recruitment on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('swaps the QR code for the button (a phone cannot scan itself)', async ({ page }) => {
    await page.goto('/recruitment');
    test.skip(!recruitment.open, 'Recruitment is closed in src/content/recruitment.json');

    await expect(page.getByRole('link', { name: /Apply now/ })).toBeVisible();
    await expect(page.getByRole('img', { name: 'QR code for the application form' })).toBeHidden();
  });
});

test.describe('contact', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('shows placeholders, never fake links, for details not supplied yet', async ({ page }) => {
    await page.goto('/contact');
    const pending = [contact.email, contact.phone, contact.address].filter((v) => v === null);

    await expect(page.locator('dd [data-placeholder]')).toHaveCount(pending.length);
    if (contact.map.embedUrl === null) {
      await expect(page.getByText('Map coming soon')).toBeVisible();
    }
    if (contact.email === null) await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
    if (contact.phone === null) await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
  });

  test('offers every live channel as a button and a QR code', async ({ page }) => {
    await page.goto('/contact');
    const channels = page.locator('section[aria-labelledby="social-channels"]');

    for (const social of liveSocials) {
      await expect(channels.getByRole('link', { name: new RegExp(social.action) })).toHaveAttribute(
        'href',
        social.href!,
      );
      if (social.qr) {
        await expect(
          channels.getByRole('img', { name: `QR code for ${social.label}` }),
        ).toBeVisible();
      }
    }
  });

  test('explains the sponsorship form honestly until it exists', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByText('The request form opens soon')).toBeVisible();
    await expect(page.locator('form')).toHaveCount(0);
  });
});

test.describe('SEO', () => {
  for (const route of siteRoutes) {
    test(`${route.href} has a canonical URL and its own share title`, async ({ page }) => {
      await page.goto(route.href);
      // Home's canonical is the bare origin (trailingSlash: false).
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        route.href === '/' ? /^https?:\/\/[^/]+\/?$/ : new RegExp(`${route.href}$`),
      );
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        'content',
        new RegExp(siteConfig.name),
      );
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{20,}/);
    });
  }

  test('sitemap.xml lists the six public pages', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body.match(/<loc>/g)).toHaveLength(siteRoutes.length);
    expect(body).not.toMatch(/\/(admin|dev)/);
  });
});
