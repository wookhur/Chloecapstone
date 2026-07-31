import { test, expect } from '@playwright/test';

const PAGES = [
  '/dashboard',
  '/courses',
  '/calendar',
  '/discussions',
  '/homework',
  '/courses/c-alg2/assignments',
  '/courses/c-alg2/people',
  '/counselor',
];

/**
 * Students use phones, so nothing may push the page sideways. 700px is included
 * because it falls between the 640px and 900px breakpoints — the gap where a
 * layout is most likely to break unnoticed.
 */
for (const width of [375, 700, 1200]) {
  test(`no horizontal page scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    const overflowing: string[] = [];

    for (const path of PAGES) {
      await page.goto(path);
      const { doc, win } = await page.evaluate(() => ({
        doc: document.documentElement.scrollWidth,
        win: window.innerWidth,
      }));
      if (doc > win + 1) overflowing.push(`${path} (${doc} > ${win})`);
    }

    expect(overflowing, `pages that scroll sideways: ${overflowing.join(', ')}`).toEqual([]);
  });
}

test.describe('phone layout', () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test('tap targets are big enough to hit', async ({ page }) => {
    await page.goto('/homework');
    const tooSmall = await page.$$eval('.btn.small, .toggle, .rail-item', (els) =>
      els
        .map((e) => ({ label: e.textContent?.trim().slice(0, 20), height: Math.round(e.getBoundingClientRect().height) }))
        .filter((x) => x.height > 0 && x.height < 40),
    );
    expect(tooSmall, JSON.stringify(tooSmall)).toEqual([]);
  });

  test('the nav rail becomes a bottom bar and content clears it', async ({ page }) => {
    await page.goto('/dashboard');
    expect(await page.$eval('.global-rail', (e) => getComputedStyle(e).position)).toBe('fixed');
    const padding = await page.$eval('.rail-main', (e) => parseFloat(getComputedStyle(e).paddingBottom));
    expect(padding).toBeGreaterThanOrEqual(60);
  });

  test('the To-Do panel comes before course cards', async ({ page }) => {
    await page.goto('/dashboard');
    expect(await page.$eval('.dashboard-layout', (e) => getComputedStyle(e).flexDirection))
      .toBe('column-reverse');
  });
});

test.describe('dark mode', () => {
  test.use({ colorScheme: 'dark' });

  test('surfaces and text invert with the OS setting', async ({ page }) => {
    await page.goto('/dashboard');
    const luminance = (color: string) => {
      const [r, g, b] = color.match(/\d+/g)!.map(Number);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    expect(luminance(await page.$eval('body', (e) => getComputedStyle(e).backgroundColor))).toBeLessThan(80);
    expect(luminance(await page.$eval('body', (e) => getComputedStyle(e).color))).toBeGreaterThan(150);
    expect(luminance(await page.$eval('.card, .course-card', (e) => getComputedStyle(e).backgroundColor))).toBeLessThan(90);
  });
});

test.describe('accessibility', () => {
  test('every form control has an accessible name', async ({ page }) => {
    const unlabeled: string[] = [];

    for (const path of ['/calendar', '/discussions', '/counselor', '/courses/c-alg2/assignments']) {
      await page.goto(path);
      // Open the forms so their controls exist in the DOM.
      for (const selector of ['button:has-text("Add event")', 'button:has-text("+ New")']) {
        const button = await page.$(selector);
        if (button) await button.click();
      }
      const found = await page.$$eval(
        'input:not([type=radio]):not([type=checkbox]), select, textarea',
        (els) =>
          els
            .filter((e) => {
              if (e.getAttribute('aria-label') || e.getAttribute('aria-labelledby')) return false;
              if (e.id && document.querySelector(`label[for="${e.id}"]`)) return false;
              return !e.closest('label');
            })
            .map((e) => e.tagName.toLowerCase()),
      );
      if (found.length) unlabeled.push(`${path}: ${found.join(', ')}`);
    }

    expect(unlabeled, unlabeled.join(' | ')).toEqual([]);
  });

  test('keyboard focus is visible', async ({ page }) => {
    await page.goto('/dashboard');
    // Wait for the first focusable element to exist, or Tab lands on <body>.
    await page.locator('.rail-item').first().waitFor();
    await page.keyboard.press('Tab');

    const focused = await page.evaluate(() => ({
      tag: document.activeElement?.tagName ?? 'NONE',
      outline: document.activeElement
        ? getComputedStyle(document.activeElement).outlineWidth
        : '0px',
    }));
    expect(focused.tag).not.toBe('BODY');
    expect(focused.outline).not.toBe('0px');
  });

  test('icon-only buttons are named for screen readers', async ({ page }) => {
    await page.goto('/calendar');
    const nameless = await page.evaluate(() =>
      [...document.querySelectorAll('button')]
        .filter((b) => {
          const text = (b.textContent || '').trim();
          const iconOnly = text.length <= 2 && /[^\w\s]/.test(text);
          return iconOnly && !b.getAttribute('aria-label') && !b.getAttribute('title');
        })
        .map((b) => b.textContent?.trim()),
    );
    expect(nameless).toEqual([]);
  });
});
