import { expect, type Page, test } from '@playwright/test';

import domains from '@/content/domains.json';
import { siteRoutes } from '@/lib/site';

/**
 * Premium pass acceptance (D-037): the motion layer decorates, it never costs
 * content. Titles are real text that comes to rest, reduced motion shows every
 * word at full strength, decoration never takes a click, and the last element
 * on a phone-sized page still arrives.
 */

const innerRoutes = siteRoutes.filter((route) => route.href !== '/');

/**
 * Every split word matching `selector`, at rest: fully opaque, with no offset
 * or lean left (a finished `both` keyframe leaves an identity matrix, not `none`).
 */
async function wordsAtRest(page: Page, selector: string) {
  return page.locator(selector).evaluateAll((words) =>
    words.every((word) => {
      const style = getComputedStyle(word);
      return new DOMMatrix(style.transform).isIdentity && style.opacity === '1';
    }),
  );
}

/** Wheel down until the page cannot scroll further, as a reader would. */
async function readToTheEnd(page: Page) {
  for (let step = 0; step < 60; step += 1) {
    const atEnd = await page.evaluate(
      () => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2,
    );
    if (atEnd) break;
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(50);
  }
}

test.describe('page titles', () => {
  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    for (const route of innerRoutes) {
      test(`${route.href}: the title rises in CSS alone and comes to rest`, async ({ page }) => {
        await page.goto(route.href);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expect.poll(() => wordsAtRest(page, 'h1 [data-word]'), { timeout: 5000 }).toBe(true);
      });
    }
  });

  test('a split heading keeps its name for assistive technology', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Find your place in the spectrum', exact: true }),
    ).toBeAttached();
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const route of siteRoutes) {
    test(`${route.href}: every word and entrance is at full strength`, async ({ page }) => {
      await page.goto(route.href);
      await page.waitForLoadState('networkidle');
      await readToTheEnd(page);
      expect(await wordsAtRest(page, 'main [data-word]')).toBe(true);
      // Nothing scroll-triggered was left part-way or hidden.
      // Only decoration may be translucent (backdrops, scrims), never content.
      const fadedContent = await page
        .locator('main :is(h1, h2, h3, h4, p, li, a, button)')
        .evaluateAll(
          (elements) =>
            elements.filter(
              (element) =>
                Number(getComputedStyle(element).opacity) < 1 && !element.closest('[aria-hidden]'),
            ).length,
        );
      expect(fadedContent, 'translucent content elements').toBe(0);
    });
  }

  test('the domain ticker stands still, wherever the page is scrolled', async ({ page }) => {
    await page.goto('/');
    await readToTheEnd(page);
    const moved = await page
      .locator('[aria-hidden="true"] > .w-max')
      .evaluateAll((tracks) =>
        tracks.some((track) => !new DOMMatrix(getComputedStyle(track).transform).isIdentity),
      );
    expect(moved).toBe(false);
  });
});

test.describe('decoration', () => {
  test('never takes a click or a screen reader’s attention', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/about');
    const grain = page.locator('[data-film-grain]');
    await expect(grain).toHaveAttribute('aria-hidden', 'true');
    await expect(grain).toHaveCSS('pointer-events', 'none');
    // A click on the title lands on the title, not on the grain above it.
    const title = page.getByRole('heading', { level: 1 });
    const hit = await title.evaluate((heading) => {
      const box = heading.getBoundingClientRect();
      const top = document.elementFromPoint(box.left + 4, box.top + box.height / 2);
      return Boolean(top && heading.contains(top));
    });
    expect(hit).toBe(true);
  });

  test('Home names each domain and links it to its description', async ({ page }) => {
    await page.goto('/');
    const overview = page.locator('section[aria-labelledby="domains-overview"]');
    for (const domain of domains) {
      await expect(overview.getByRole('link', { name: domain.name, exact: true })).toHaveAttribute(
        'href',
        `/recruitment#${domain.id}`,
      );
    }
  });
});

test.describe('the end of the page', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the footer wordmark still arrives on a phone (reachable trigger points)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await readToTheEnd(page);
    const wordmark = page.locator('[data-site-footer] p.text-display-3xl');
    // Its reveal wrapper plays once the reader reaches the bottom.
    await expect(wordmark.locator('..')).toHaveCSS('opacity', '1', { timeout: 5000 });
  });

  test('…and after a client navigation to a shorter page (triggers re-measured)', async ({
    page,
  }) => {
    // The footer lives in the layout: its trigger was measured on the first,
    // longer page and must be re-measured for the next one.
    await page.goto('/gallery');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page
      .getByRole('navigation', { name: 'Site menu' })
      .getByRole('link', { name: 'About', exact: true })
      .click();
    await expect(page).toHaveURL(/\/about$/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await readToTheEnd(page);
    const wordmark = page.locator('[data-site-footer] p.text-display-3xl');
    await expect(wordmark.locator('..')).toHaveCSS('opacity', '1', { timeout: 5000 });
  });
});

test.describe('arriving at a domain', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('a Home domain link outlines its card on /recruitment, client-side too', async ({
    page,
  }) => {
    const domain = domains[2]!;
    await page.goto('/');
    await page
      .locator('section[aria-labelledby="domains-overview"]')
      .getByRole('link', { name: domain.name, exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`/recruitment#${domain.id}$`), { timeout: 15_000 });
    // `:target` is not set by a client navigation; HashTarget marks the card.
    await expect(page.locator(`#${domain.id}`)).toHaveAttribute('data-targeted', 'true');
    await expect(page.locator(`#${domain.id}`)).toBeInViewport();
  });
});

test.describe('robustness', () => {
  test('a mangled #fragment never takes /recruitment down', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/recruitment#%');
    await expect(page.getByRole('heading', { level: 1, name: 'Recruitment' })).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });

  test('a page taller than the window shows everything (no scroll to trigger it)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    // Grow the window past the page: it can no longer scroll at all.
    await page.setViewportSize({ width: 1440, height: 5000 });
    await expect(page.getByLabel('Your name')).toBeVisible();
    await expect
      .poll(() => wordsAtRest(page, '#sponsorship [data-word]'), { timeout: 5000 })
      .toBe(true);
    await expect(page.locator('[data-site-footer] p.text-display-3xl').locator('..')).toHaveCSS(
      'opacity',
      '1',
      { timeout: 5000 },
    );
  });

  test('the outlined domain clears when the fragment does', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const domain = domains[0]!;
    await page.goto(`/recruitment#${domain.id}`);
    await expect(page.locator(`#${domain.id}`)).toHaveAttribute('data-targeted', 'true');
    // The header's Recruitment link: same page, no fragment.
    await page
      .getByRole('banner')
      .getByRole('link', { name: /Recruitment/ })
      .click();
    await expect(page).toHaveURL(/\/recruitment$/);
    await expect(page.locator('[data-targeted]')).toHaveCount(0);
  });
});
