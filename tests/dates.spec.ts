import { test, expect } from '@playwright/test';
import { USERS, signInAs } from './helpers';

/**
 * Regression tests for the timezone bug that made the app show the wrong day.
 *
 * toISODate() once formatted via toISOString() (UTC) while parseISO() and
 * monthGrid() build local dates. East of UTC that shifted every calendar item
 * forward a day; west of UTC, evening users saw today's homework as past due.
 * These run in three offsets so a regression can't hide in one region.
 */
for (const timezoneId of ['Asia/Seoul', 'America/New_York', 'Pacific/Kiritimati']) {
  test.describe(`timezone ${timezoneId}`, () => {
    test.use({ timezoneId });

    test('today is highlighted on the real local date', async ({ page }) => {
      await page.goto('/calendar');
      await signInAs(page, USERS.mina);

      const localDay = Number(
        new Intl.DateTimeFormat('en-CA', { timeZone: timezoneId, day: 'numeric' })
          .format(new Date()),
      );
      const highlighted = Number(
        await page.locator('.calendar-cell.today .calendar-date').textContent(),
      );
      expect(highlighted).toBe(localDay);
    });

    test('work due today lands in the today cell', async ({ page }) => {
      await page.goto('/calendar');
      await signInAs(page, USERS.mina);
      await expect(page.locator('.calendar-cell.today')).toContainText('Quadratics worksheet');
    });

    test('the To Do "Today" filter shows today\'s homework', async ({ page }) => {
      await page.goto('/homework');
      await signInAs(page, USERS.mina);
      await page.click('.toggle:has-text("Today")');
      await expect(page.locator('.content')).toContainText('Quadratics worksheet');
    });
  });
}
