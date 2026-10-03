import { expect, type Page, test } from '@playwright/test';

import domains from '@/content/domains.json';

import { hasFiles, hasRecords, signIn, testImage, testPdf, unique } from './helpers';

/**
 * Stage 8: the team and the recruitment settings, admin ↔ public. Every save
 * must show on the public pages at the next load, with no redeploy. Tests
 * create their own records and delete them, and the recruitment settings are
 * put back as they were.
 */
test.skip(!hasRecords || !hasFiles, 'Needs a data store: Upstash + R2, or DATA_BACKEND=local');
// Whole flows (sign in, upload, save, check the public pages, clean up).
test.describe.configure({ timeout: 90_000 });

/** Save, and wait for this save's own confirmation (not an earlier toast). */
async function save(page: Page, button: string, confirmation: string | RegExp) {
  await page.getByRole('button', { name: button, exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: confirmation })).toBeVisible({
    timeout: 30_000,
  });
}

/* -------------------------------------------------------------------------- */
/* Team                                                                       */
/* -------------------------------------------------------------------------- */

test.describe('team', () => {
  // The core team's order is shared: these tests take turns.
  test.describe.configure({ mode: 'serial' });

  async function addMember(page: Page, name: string, position: string) {
    await page.goto('/admin/team/new');
    await page.getByLabel('Name').fill(name);
    await page.getByLabel('Position').fill(position);
    await save(page, 'Add member', 'Member added to the team');
    await expect(page).toHaveURL(/\/admin\/team\/[0-9a-f-]{36}$/, { timeout: 30_000 });
    return page.url();
  }

  async function removeMember(page: Page, editor: string) {
    await page.goto(editor);
    await page.getByRole('button', { name: 'Remove member' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page).toHaveURL('/admin/team', { timeout: 30_000 });
  }

  /** The cards of one tier on /about. */
  const tier = (page: Page, label: 'Core team' | 'Domain secretaries') =>
    page.getByRole('region', { name: label });

  test('a new member appears on About with their photo, follows edits, and goes', async ({
    page,
  }) => {
    const name = unique('Member');
    await signIn(page, '/admin/team/new');
    await page.getByLabel('Name').fill(name);
    await page.getByLabel('Position').fill('E2E Treasurer');
    await page
      .getByRole('group', { name: 'Photo' })
      .locator('input[type="file"]')
      .setInputFiles(testImage('member.png'));
    await expect(page.getByLabel('Describe the image (alt text)')).toHaveValue(`Photo of ${name}`, {
      timeout: 30_000,
    });
    await save(page, 'Add member', 'Member added to the team');
    await expect(page).toHaveURL(/\/admin\/team\/[0-9a-f-]{36}$/, { timeout: 30_000 });
    const editor = page.url();

    const about = await page.context().newPage();
    await about.goto('/about');
    const card = tier(about, 'Core team').getByRole('listitem').filter({ hasText: name });
    await expect(card.getByRole('img', { name: `Photo of ${name}` })).toBeVisible();
    await expect(card).toContainText('E2E Treasurer');

    // Becoming a secretary needs a domain, and then shows it.
    const domain = domains[1]!;
    await page.getByLabel('Part of').selectOption('secretary');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByLabel('Domain they lead')).toHaveAttribute('aria-invalid', 'true');
    await page.getByLabel('Domain they lead').selectOption(domain.id);
    await save(page, 'Save changes', 'Saved. About shows it now.');

    await about.reload();
    const moved = tier(about, 'Domain secretaries').getByRole('listitem').filter({
      hasText: name,
    });
    await expect(moved).toContainText(domain.name);
    await expect(tier(about, 'Core team').getByText(name)).toHaveCount(0);

    await removeMember(page, editor);
    await about.reload();
    // Wait for the streamed team before checking the member is gone.
    await expect(tier(about, 'Core team')).toBeVisible();
    await expect(about.getByText(name)).toHaveCount(0);
  });

  test('the core team can be reordered, and About follows', async ({ page }) => {
    const first = unique('First');
    const second = unique('Second');
    await signIn(page, '/admin/team');
    const firstEditor = await addMember(page, first, 'E2E Office-bearer');
    const secondEditor = await addMember(page, second, 'E2E Office-bearer');

    // New members join the end of the core team, in the order they were added.
    const names = async (target: Page) => {
      const core = tier(target, 'Core team');
      // The team streams in after the page shell: wait for both cards first.
      await expect(core.getByText(first)).toBeVisible();
      await expect(core.getByText(second)).toBeVisible();
      return (await core.getByRole('heading', { level: 3 }).allTextContents()).map((text) =>
        text.trim(),
      );
    };
    const about = await page.context().newPage();
    await about.goto('/about');
    let order = await names(about);
    expect(order.indexOf(second)).toBe(order.indexOf(first) + 1);

    await page.goto('/admin/team');
    await page.getByRole('button', { name: `Move ${second} up` }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Order saved' })).toBeVisible({
      timeout: 30_000,
    });

    await about.reload();
    order = await names(about);
    expect(order.indexOf(first)).toBe(order.indexOf(second) + 1);

    await removeMember(page, firstEditor);
    await removeMember(page, secondEditor);
  });

  test('without a photo, the card shows initials', async ({ page }) => {
    const name = `${unique('Initials')} Zed`;
    await signIn(page, '/admin/team');
    const editor = await addMember(page, name, 'E2E Office-bearer');

    await page.goto('/about');
    const card = tier(page, 'Core team').getByRole('listitem').filter({ hasText: name });
    await expect(card).toContainText('EZ');
    await expect(card.getByRole('img')).toHaveCount(0);

    await removeMember(page, editor);
  });
});

/* -------------------------------------------------------------------------- */
/* Recruitment                                                                */
/* -------------------------------------------------------------------------- */

test.describe('recruitment', () => {
  // One settings record for the whole site: these steps run in order.
  test.describe.configure({ mode: 'serial' });
  test.use({ viewport: { width: 1280, height: 900 } });

  const FORM = 'https://forms.gle/e2e-test-form';
  let original: { open: boolean; formUrl: string } | undefined;

  async function settings(page: Page, change: { open: boolean; formUrl?: string }) {
    await page.goto('/admin/recruitment');
    const open = page.getByRole('checkbox', { name: /Recruitment is open/ });
    original ??= {
      open: await open.isChecked(),
      formUrl: await page.getByLabel('Application form link').inputValue(),
    };
    if (change.formUrl !== undefined) {
      await page.getByLabel('Application form link').fill(change.formUrl);
    }
    await open.setChecked(change.open);
  }

  const saveSettings = (page: Page) =>
    page.getByRole('button', { name: /^(Save changes|Save settings)$/ }).click();

  const savedToast = (page: Page) =>
    expect(page.getByRole('status').filter({ hasText: 'Saved. /recruitment' })).toBeVisible({
      timeout: 30_000,
    });

  test.afterAll(async ({ browser }) => {
    if (!original) return;
    const page = await browser.newPage();
    await signIn(page, '/admin/recruitment');
    await page.getByLabel('Application form link').fill(original.formUrl);
    await page.getByRole('checkbox', { name: /Recruitment is open/ }).setChecked(original.open);
    if (await page.getByRole('button', { name: /^(Save changes|Save settings)$/ }).isEnabled()) {
      await saveSettings(page);
      await savedToast(page);
    }
    await page.close();
  });

  test('cannot open without the form link', async ({ page }) => {
    await signIn(page, '/admin/recruitment');
    await settings(page, { open: true, formUrl: '' });
    await saveSettings(page);
    await expect(page.getByLabel('Application form link')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Recruitment cannot be open without a form link')).toBeVisible();
  });

  test('open: Apply now, a QR code, the header marked open, the PDF "coming soon"', async ({
    page,
  }) => {
    await signIn(page, '/admin/recruitment');
    await settings(page, { open: true, formUrl: FORM });
    const pdf = page.getByRole('button', { name: 'Remove' });
    if (await pdf.isVisible()) await pdf.click();
    await saveSettings(page);
    await savedToast(page);

    await page.goto('/recruitment');
    const apply = page.getByRole('link', { name: /Apply now/ });
    await expect(apply).toHaveAttribute('href', FORM);
    await expect(apply).toHaveAttribute('target', '_blank');
    await expect(apply).toHaveAttribute('rel', /noopener/);
    await expect(page.getByRole('img', { name: 'QR code for the application form' })).toBeVisible();
    await expect(
      page.getByText('The roles and responsibilities document is coming soon.'),
    ).toBeVisible();
    await expect(
      page.getByRole('banner').getByRole('link', { name: /Recruitment \(open now\)/ }),
    ).toBeVisible();

    // A phone gets the button only: it cannot scan its own screen.
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(apply).toBeVisible();
    await expect(page.getByRole('img', { name: 'QR code for the application form' })).toBeHidden();
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(
      page.getByRole('navigation', { name: 'Site menu' }).getByText('Open now'),
    ).toBeVisible();
  });

  test('the roles PDF, once uploaded, is linked; removed, it is "coming soon" again', async ({
    page,
  }) => {
    await signIn(page, '/admin/recruitment');
    await settings(page, { open: true, formUrl: FORM });
    await page
      .getByRole('group', { name: 'Roles PDF' })
      .locator('input[type="file"]')
      .setInputFiles(testPdf('roles.pdf'));
    await expect(page.getByRole('link', { name: 'Open the current PDF' })).toBeVisible({
      timeout: 30_000,
    });
    await saveSettings(page);
    await savedToast(page);

    await page.goto('/recruitment');
    const link = page.getByRole('link', { name: /Roles & responsibilities \(PDF\)/ });
    await expect(link).toHaveAttribute('href', /\.pdf$/);
    const file = await page.request.get((await link.getAttribute('href'))!);
    expect(file.headers()['content-type']).toBe('application/pdf');

    await page.goto('/admin/recruitment');
    await page.getByRole('button', { name: 'Remove' }).click();
    await saveSettings(page);
    await savedToast(page);
    await page.goto('/recruitment');
    await expect(
      page.getByText('The roles and responsibilities document is coming soon.'),
    ).toBeVisible();
    await expect(link).toHaveCount(0);
  });

  test('closed: no form, the domains stay, the header is not marked', async ({ page }) => {
    await signIn(page, '/admin/recruitment');
    await settings(page, { open: false });
    await saveSettings(page);
    await savedToast(page);

    await page.goto('/recruitment');
    await expect(page.getByText('Applications are closed right now')).toBeVisible();
    await expect(page.getByRole('link', { name: /Apply now/ })).toHaveCount(0);
    await expect(page.locator(`#${domains[0]!.id}`)).toContainText(domains[0]!.description);
    await expect(page.getByRole('banner').getByRole('link', { name: 'Recruitment' })).toHaveText(
      'Recruitment',
    );
  });
});
