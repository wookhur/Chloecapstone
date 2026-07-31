import type { Page } from '@playwright/test';

/** Demo profile ids from src/lib/demoData.ts. */
export const USERS = {
  mina: 's-mina',
  jay: 's-jay',
  leo: 's-leo',
  zoe: 's-zoe',
  anderson: 't-anders',
  rivera: 'co-rivera',
  kim: 'pa-kim',
} as const;

/** Switch accounts via the top-right picker. */
export async function signInAs(page: Page, userId: string) {
  await page.selectOption('#user', userId);
  await page.waitForTimeout(300);
}

/**
 * Navigate with the in-app rail rather than page.goto. Demo mode keeps data in
 * memory, so a full page load resets anything the test just created.
 */
export async function navTo(page: Page, label: string) {
  await page.click(`.rail-item:has-text("${label}")`);
  await page.waitForTimeout(300);
}

/** Local YYYY-MM-DD, matching src/lib/dates.ts toISODate. */
export function isoDate(offsetDays = 0, timeZone?: string) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  if (!timeZone) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(d);
}
