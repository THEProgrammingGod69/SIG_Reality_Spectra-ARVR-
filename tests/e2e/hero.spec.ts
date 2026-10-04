import { expect, test, type Page } from '@playwright/test';

import site from '@/content/site.json';
import { siteConfig } from '@/lib/site';

/**
 * Stage 2 acceptance for the landing hero (D-010):
 *   - the name and calls to action are real text, readable with no JS and no WebGL;
 *   - reduced motion gets the designed still — no canvas, no intro;
 *   - the intro plays at most once per session.
 */

const heroName = () => ({ level: 1, name: siteConfig.name }) as const;

async function heroSection(page: Page) {
  const section = page.locator('section[data-hero-tier]');
  await expect(section).toHaveCount(1);
  return section;
}

test.describe('hero without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('shows the name, intro line and calls to action over the still', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', heroName())).toBeVisible();
    await expect(page.getByText(site.tagline).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Explore events' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Join the club' })).toBeVisible();
    await expect(page.getByTestId('hero-still')).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(0);
  });
});

test.describe('hero with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('renders the static still and never mounts a canvas', async ({ page }) => {
    await page.goto('/');
    const section = await heroSection(page);

    await expect(section).toHaveAttribute('data-hero-tier', 'static');
    await expect(page.getByTestId('hero-still')).toHaveCSS('opacity', '1');
    await expect(page.getByRole('heading', heroName())).toBeVisible();

    // Give a lazy canvas every chance to appear, then confirm it did not.
    await page.waitForTimeout(1000);
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /skip intro/i })).toHaveCount(0);
    await expect(section).toHaveAttribute('data-hero-intro', 'idle');
  });

  test('shows every word of the name at full strength', async ({ page }) => {
    await page.goto('/');
    const words = page.getByRole('heading', heroName()).locator(':scope > span.inline-block');

    await expect(words).toHaveCount(siteConfig.name.split(' ').length);
    for (const word of await words.all()) {
      await expect(word).toHaveCSS('opacity', '1');
    }
  });
});

test.describe('hero with JavaScript', () => {
  test('the name is in the server HTML, not painted in later', async ({ request }) => {
    const html = await (await request.get('/')).text();
    expect(html).toMatch(/<h1[^>]*id="hero-title"/);
    for (const word of siteConfig.name.split(' ')) expect(html).toContain(`>${word}</span>`);
  });

  test('content is readable within 1.5 seconds', async ({ page }) => {
    await page.goto('/', { waitUntil: 'commit' });
    await expect(page.getByRole('heading', heroName())).toBeVisible({ timeout: 1500 });
    await expect(page.getByRole('link', { name: 'Explore events' })).toBeVisible({ timeout: 1500 });
  });

  test('picks a device tier after hydration', async ({ page }) => {
    await page.goto('/');
    const section = await heroSection(page);
    await expect(section).toHaveAttribute('data-hero-tier', /^(static|low|high)$/);
  });

  test('plays the intro at most once per session', async ({ page }) => {
    await page.addInitScript(() => {
      // Record every intro phase the hero passes through on this page load.
      const seen = new Set<string>();
      (window as unknown as { __introPhases: Set<string> }).__introPhases = seen;
      new MutationObserver(() => {
        const phase = document
          .querySelector('section[data-hero-tier]')
          ?.getAttribute('data-hero-intro');
        if (phase) seen.add(phase);
      }).observe(document, {
        subtree: true,
        attributes: true,
        attributeFilter: ['data-hero-intro'],
      });
    });

    // Headless browsers draw WebGL in software, which gets the static still
    // (D-033); the development server honours ?hero-tier, so the intro is
    // still exercised there.
    await page.goto('/?hero-tier=low');
    const section = await heroSection(page);
    const tier = await section.getAttribute('data-hero-tier');
    test.skip(tier === 'static', 'No hardware WebGL 2 here: the static tier has no intro.');

    await expect(section).toHaveAttribute('data-hero-intro', 'done', { timeout: 15_000 });

    await page.reload();
    await expect(await heroSection(page)).toHaveAttribute('data-hero-intro', 'done', {
      timeout: 15_000,
    });
    const phases = await page.evaluate(() => [
      ...(window as unknown as { __introPhases: Set<string> }).__introPhases,
    ]);
    expect(phases).not.toContain('playing');
  });
});
