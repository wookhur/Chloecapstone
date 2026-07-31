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
