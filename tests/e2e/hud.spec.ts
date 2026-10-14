import { expect, type Page, test } from '@playwright/test';

import domains from '@/content/domains.json';
import { primaryNavRoutes } from '@/lib/site';

/**
 * The XR HUD layer (D-038): the navigation rail, the targeting reticle, the
 * page-change shutter, the Home domain rail and purpose stack, decoding
 * labels and the footer's floating wordmark. Like the rest of the motion
 * layer it decorates and never costs content: names stay names, decoration
 * never takes a click, and reduced motion turns every piece off.
 */

const railRoutes = primaryNavRoutes.filter((route) => route.href !== '/');

/** Every footer wordmark character, at rest: in place and fully opaque. */
async function wordmarkAtRest(page: Page) {
  return page.locator('[data-site-footer] [data-char]').evaluateAll((chars) =>
    chars.every((char) => {
      const style = getComputedStyle(char);
      return new DOMMatrix(style.transform).isIdentity && style.opacity === '1';
    }),
  );
}

/** Wheel down until the page cannot scroll further, as a reader would. */
async function readToTheEnd(page: Page) {
  for (let step = 0; step < 80; step += 1) {
    const atEnd = await page.evaluate(
      () => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2,
    );
    if (atEnd) break;
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(50);
  }
}

test.describe('desktop', () => {
  test.use({ viewport: { width: 1280, height: 860 } });
  test.skip(({ isMobile }) => isMobile, 'Desktop only');

  test('the HUD rail locks onto the current page and follows the pointer', async ({ page }) => {
    await page.goto('/events');
    const nav = page.getByRole('navigation', { name: 'Primary' });
    const frame = nav.locator('li[data-idle]');
    await expect(frame).toHaveAttribute('data-idle', 'false');
    await expect(frame).toHaveAttribute('aria-hidden', 'true');

    // Names stay names: the number and the decoding copy are hidden.
    for (const route of railRoutes) {
      await expect(nav.getByRole('link', { name: route.label, exact: true })).toBeVisible();
    }

    const lead = frame.locator('span').first();
    const before = await lead.evaluate((element) => element.style.transform);
    await nav.getByRole('link', { name: 'Contact', exact: true }).hover();
    await expect.poll(() => lead.evaluate((element) => element.style.transform)).not.toBe(before);
    await expect(nav.getByRole('link', { name: 'Contact', exact: true })).toHaveAccessibleName(
      'Contact',
    );
  });

  test('the reticle locks onto what can be clicked, and never takes the click', async ({
    page,
  }) => {
    await page.goto('/contact');
    const reticle = page.locator('[data-reticle-cursor]');
    await expect(reticle).toHaveAttribute('aria-hidden', 'true');
    await expect(reticle).toHaveCSS('pointer-events', 'none');

    await page
      .getByRole('banner')
      .getByRole('link', { name: /Recruitment/ })
      .hover();
    await expect(reticle).toHaveAttribute('data-locked', 'true');
    // The system cursor is never hidden.
    expect(await page.evaluate(() => getComputedStyle(document.body).cursor)).not.toBe('none');

    await page.getByRole('heading', { level: 1 }).hover();
    await expect(reticle).toHaveAttribute('data-locked', 'false');
  });

  test('a client navigation lifts a shutter that never takes a click', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
    await page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('link', { name: 'Gallery', exact: true })
      .click();
    await expect(page).toHaveURL(/\/gallery$/, { timeout: 15_000 });
    const shutter = page.locator('[data-shutter]');
    // Once the slats have lifted, the shutter is gone.
    await expect(shutter).toHaveCount(0, { timeout: 5000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Home: the domains ride a rail, and keyboard focus brings a panel into view', async ({
    page,
  }) => {
    await page.goto('/');
    const overview = page.locator('section[aria-labelledby="domains-overview"]');
    await expect(overview.locator('[data-domain-rail]')).toHaveAttribute('data-rail', 'on');

    const last = domains.at(-1)!;
    const link = overview.getByRole('link', { name: last.name, exact: true });
    await link.focus();
    await expect(link).toBeInViewport();
    await expect(link).toHaveAttribute('href', `/recruitment#${last.id}`);
  });

  test('Home: the purpose panels stick and stack', async ({ page }) => {
    await page.goto('/');
    const panels = page.locator('section[aria-labelledby="mission-vision"] li');
    await expect(panels).toHaveCount(3);
    await expect(panels.first()).toHaveCSS('position', 'sticky');
  });

  test('the footer wordmark floats into place by the end of the page', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');
    await readToTheEnd(page);
    await expect.poll(() => wordmarkAtRest(page), { timeout: 5000 }).toBe(true);
  });

  test('without a GPU, the page intro keeps the static lab (no canvas)', async ({ page }) => {
    // Headless Chromium draws WebGL in software: the static tier.
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-intro-field]')).toHaveAttribute('data-intro-field', 'off');
    await expect(page.locator('[data-intro-field] canvas')).toHaveCount(0);
  });
});

test.describe('labels decode, and stay readable', () => {
  test('a decoding eyebrow keeps its real text, once', async ({ page }) => {
    await page.goto('/');
    const overview = page.locator('section[aria-labelledby="domains-overview"]');
    await expect(overview.getByText(`${domains.length} domains`, { exact: true })).toHaveCount(1);
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 1280, height: 860 } });
  test.skip(({ isMobile }) => isMobile, 'Desktop only');

  test('no reticle, no shutter, no rail, no stack — and the wordmark is simply there', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('[data-reticle-cursor]')).toBeHidden();
    await expect(page.locator('[data-domain-rail]')).toHaveAttribute('data-rail', 'off');
    await expect(
      page.locator('section[aria-labelledby="mission-vision"] li').first(),
    ).not.toHaveCSS('position', 'sticky');
    expect(await wordmarkAtRest(page)).toBe(true);

    await page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('link', { name: 'About', exact: true })
      .click();
    await expect(page).toHaveURL(/\/about$/, { timeout: 15_000 });
    await expect(page.locator('[data-shutter]')).toHaveCount(0);
  });
});

test.describe('phones', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('Home lists the domains as a grid, not a rail', async ({ page }) => {
    await page.goto('/');
    const overview = page.locator('section[aria-labelledby="domains-overview"]');
    await expect(overview.locator('[data-domain-rail]')).toHaveAttribute('data-rail', 'off');
    for (const domain of domains) {
      await expect(overview.getByRole('link', { name: domain.name, exact: true })).toBeAttached();
    }
  });
});
