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

test.describe('demo link for showing the app to someone', () => {
  // These run against the CONFIGURED build, which normally demands sign-in.
  // The point of ?demo is that it gets past that door without an account.
  test('?demo skips the sign-in gate entirely', async ({ page }) => {
    await page.goto('/?demo');
    await expect(page.locator('.signin-card')).toHaveCount(0);
    await expect(page.locator('.rail-item').first()).toBeVisible();
    await expect(page.locator('.content')).toContainText('Sample data');
  });

  test('every role is reachable without an account', async ({ page }) => {
    await page.goto('/?demo');
    // The account switcher is what makes a demo worth giving someone: a
    // teacher can see the teacher view without one being created for them.
    const options = await page.locator('#user option').allTextContents();
    expect(options.some((o) => o.includes('Ms. Anderson'))).toBe(true);
    expect(options.some((o) => o.includes('Rivera'))).toBe(true);
    expect(options.some((o) => o.includes('Kim'))).toBe(true);
  });

  test('demo mode survives navigating around', async ({ page }) => {
    await page.goto('/?demo');
    // The query string is gone after a client-side route change, so without
    // the remembered flag the next click would bounce back to sign-in.
    await page.click('.rail-item:has-text("Calendar")');
    await expect(page.locator('.calendar-grid')).toBeVisible();
    await expect(page.locator('.signin-card')).toHaveCount(0);
  });

  test('?demo=0 hands the door back', async ({ page }) => {
    await page.goto('/?demo');
    await expect(page.locator('.rail-item').first()).toBeVisible();

    await page.goto('/?demo=0');
    await expect(page.locator('.signin-card')).toBeVisible();
  });

  test('the sign-in gate still holds for anyone who did not ask', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('.signin-card')).toBeVisible();
  });
});
