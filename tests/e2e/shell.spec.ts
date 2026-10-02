import { expect, test } from '@playwright/test';

import { clubCredit, primaryNavRoutes, siteConfig, siteRoutes } from '@/lib/site';

/**
 * Stage 3 acceptance for the site shell: header (PillNav + CTA), mobile menu,
 * footer, page transitions and layout robustness. Cases are generated from
 * `siteRoutes`, so a new page is covered automatically.
 */

const pillRoutes = primaryNavRoutes.filter((route) => route.href !== '/');

test.describe('desktop header', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('shows the primary links, marks the current page and offers the CTA', async ({ page }) => {
    await page.goto('/events');
    const nav = page.getByRole('navigation', { name: 'Primary' });

    for (const route of pillRoutes) {
      await expect(nav.getByRole('link', { name: route.label, exact: true })).toBeVisible();
    }
    await expect(nav.getByRole('link', { name: 'Events', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByRole('banner').getByRole('link', { name: 'Recruitment' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden();
  });

  test('keyboard focus reaches the navigation with a visible focus ring', async ({ page }) => {
    await page.goto('/about');

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Tab'); // logo
    await page.keyboard.press('Tab'); // first pill

    const focused = page.locator(':focus');
    await expect(focused).toHaveAccessibleName(pillRoutes[0]!.label);
    expect(await focused.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');
  });

  test('the header turns to glass once the page scrolls', async ({ page }) => {
    await page.goto('/');
    const header = page.getByRole('banner');

    await expect(header).not.toHaveAttribute('data-scrolled');
    await page.mouse.wheel(0, 800);
    await expect(header).toHaveAttribute('data-scrolled', 'true');
  });

  test('a client-side navigation lands on a fully visible page', async ({ page }) => {
    await page.goto('/about');
    await page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('link', { name: 'Gallery', exact: true })
      .click();

    await expect(page).toHaveURL(/\/gallery$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('#main-content > div').first()).toHaveCSS('opacity', '1');
  });
});

test.describe('mobile menu', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('opens on focus, traps Tab, closes with Escape and returns focus', async ({ page }) => {
    await page.goto('/about');
    const menu = page.getByRole('navigation', { name: 'Site menu' });
    const main = page.locator('#main-content');

    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeHidden();
    await expect(menu).toBeHidden();

    await page.getByRole('button', { name: 'Open menu' }).click();
    const close = page.getByRole('button', { name: 'Close menu' });
    await expect(close).toHaveAttribute('aria-expanded', 'true');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Home', exact: true })).toBeFocused();

    for (const route of siteRoutes) {
      await expect(menu.getByRole('link', { name: route.label, exact: true })).toBeVisible();
    }
    await expect(menu.getByRole('link', { name: 'About', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );

    // Tab past the menu's last link (pages, then channels) wraps to the toggle;
    // the page behind is inert.
    await menu.getByRole('link').last().focus();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    await expect(main).toHaveJSProperty('inert', true);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
    await expect(menu).toBeHidden();
    await expect(main).toHaveJSProperty('inert', false);
  });

  test('a menu link navigates and closes the menu', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page
      .getByRole('navigation', { name: 'Site menu' })
      .getByRole('link', { name: 'Gallery', exact: true })
      .click();

    await expect(page).toHaveURL(/\/gallery$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Site menu' })).toBeHidden();
  });
});

test.describe('layout at 360px', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  for (const route of siteRoutes) {
    test(`${route.href} has no horizontal overflow`, async ({ page }) => {
      await page.goto(route.href);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test.describe('footer and brand', () => {
  test('the footer links every public page and credits VIT Pune as text', async ({ page }) => {
    await page.goto('/contact');
    const footer = page.getByRole('contentinfo');

    await expect(footer).toContainText(clubCredit);
    for (const route of siteRoutes) {
      await expect(footer.getByRole('link', { name: route.label, exact: true })).toBeVisible();
    }
    await expect(footer.getByRole('img', { name: new RegExp(siteConfig.name) })).toBeVisible();
  });

  test('no placeholder link ships anywhere on the page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href*="TODO" i]')).toHaveCount(0);
  });

  test('the favicon and Apple touch icon are declared', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('link[rel="icon"]').first()).toHaveAttribute('href', /icon/);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
      'href',
      /apple-icon/,
    );
  });
});
