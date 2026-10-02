import { expect, test } from '@playwright/test';

/**
 * The /dev playgrounds exist only in development: production answers 404.
 * CI runs the production build (playwright.config.ts); locally the dev server.
 */

const production = Boolean(process.env.CI);

const playgrounds = [
  { href: '/dev/ui', title: 'UI playground' },
  { href: '/dev/motion', title: 'Motion playground' },
] as const;

for (const playground of playgrounds) {
  test(`${playground.href} is ${production ? 'hidden (404) in production' : 'available in development'}`, async ({
    page,
  }) => {
    const response = await page.goto(playground.href);
    expect(response?.status()).toBe(production ? 404 : 200);
    if (!production) {
      await expect(page.getByRole('heading', { level: 1, name: playground.title })).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    }
  });
}
