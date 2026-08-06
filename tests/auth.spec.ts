import { expect, test } from '@playwright/test';

/**
 * These run against the build that has Supabase env vars set (see
 * playwright.config.ts). What matters here is that turning Supabase on turns
 * the demo account switcher off — otherwise anyone could still click into
 * another student's account on a live deployment.
 */

test.describe('sign-in gate', () => {
  test('a configured deployment asks for an email before anything else', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.locator('.signin-card')).toContainText('Homework Hub');
    await expect(page.locator('#signin-email')).toBeVisible();
    await expect(page.locator('button:has-text("Email me a sign-in link")')).toBeVisible();
  });

  test('the demo account switcher is gone once sign-in is real', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('.signin-card')).toBeVisible();

    await expect(page.locator('#user')).toHaveCount(0);
    await expect(page.locator('.rail-item')).toHaveCount(0);
  });

  test('deep links do not slip past the gate', async ({ page }) => {
    for (const path of ['/courses/c-alg2/assignments', '/calendar', '/family', '/counselor']) {
      await page.goto(path);
      await expect(page.locator('.signin-card')).toBeVisible();
      await expect(page.locator('.content')).toHaveCount(0);
    }
  });

  test('the demo-mode banner is not shown when Supabase is connected', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.banner.demo')).toHaveCount(0);
  });
});

test.describe('sign-in screen', () => {
  test('the button stays out of reach until an address is typed', async ({ page }) => {
    await page.goto('/');
    const submit = page.locator('button[type=submit]');

    // Disabled, but styled as a quiet surface rather than a dead grey slab —
    // full opacity is the tell that it reads as "waiting", not "broken".
    await expect(submit).toBeDisabled();
    await expect(submit).toHaveCSS('opacity', '1');

    await page.fill('#signin-email', 'mina@school.org');
    await expect(submit).toBeEnabled();
  });

  test('the card is centred in the viewport, not floating near the top', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('.signin-card');
    const box = (await card.boundingBox())!;
    const viewport = page.viewportSize()!;

    // The old layout left the card high with a large dead area beneath it.
    const above = box.y;
    const below = viewport.height - (box.y + box.height);
    expect(Math.abs(above - below), `top ${above}px vs bottom ${below}px`).toBeLessThan(90);
  });

  test('a failure explains itself instead of printing "Failed to fetch"', async ({ page }) => {
    await page.goto('/');
    await page.fill('#signin-email', 'mina@school.org');
    await page.click('button[type=submit]');

    // The Supabase URL points at a closed port here, so this is the real
    // network-failure path a student would hit offline.
    const banner = page.locator('.banner.error');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("Couldn't reach the server");
    await expect(banner).not.toContainText('fetch');
  });
});
