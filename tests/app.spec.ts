import { test, expect } from '@playwright/test';
import { USERS, signInAs, navTo } from './helpers';

test.describe('calendar', () => {
  test('assignments and personal events are distinguishable without color', async ({ page }) => {
    await page.goto('/calendar');
    await signInAs(page, USERS.mina);
    // Subject palettes and category palettes share hex values, so the two kinds
    // must differ structurally: solid chip + dot vs outlined chip + icon.
    await expect(page.locator('.calendar-item.is-assignment').first()).toBeVisible();
    await expect(page.locator('.calendar-item.is-event').first()).toBeVisible();
  });

  test('filtering by course narrows what is shown', async ({ page }) => {
    await page.goto('/calendar');
    await signInAs(page, USERS.mina);
    await page.click('.legend-chip:has-text("Biology")');
    await expect(page.locator('.calendar-grid')).toContainText('Cell organelles');
    await expect(page.locator('.calendar-grid')).not.toContainText('Quadratics worksheet');
  });

  test('a student can add and then remove their own event', async ({ page }) => {
    await page.goto('/calendar');
    await signInAs(page, USERS.mina);
    await page.click('button:has-text("Add event")');
    await page.fill('.card .field input', 'Robotics club');
    await page.click('button:has-text("Add to calendar")');
    await expect(page.locator('.calendar-grid')).toContainText('Robotics club');

    await page.click('.calendar-item:has-text("Robotics club")');
    await page.click('.section:has-text("Selected event") .btn.danger');
    await expect(page.locator('.calendar-grid')).not.toContainText('Robotics club');
  });

  test('a counseling meeting shows who scheduled it and cannot be deleted by the student', async ({ page }) => {
    await page.goto('/calendar');
    await signInAs(page, USERS.mina);
    await page.click('.calendar-item:has-text("Counselor check-in")');

    const card = page.locator('.section:has-text("Selected event")');
    await expect(card).toContainText('Scheduled by');
    await expect(card).toContainText('Rivera');
    // Role suffixes are for the account picker only, never for displayed names.
    await expect(card.locator('p:has-text("Scheduled by")')).not.toContainText('(Counselor)');
    await expect(card.locator('.btn.danger')).toHaveCount(0);
  });
});

test.describe('assignments', () => {
  test('past-due work is listed and styled as overdue', async ({ page }) => {
    await page.goto('/courses/c-alg2/assignments');
    await signInAs(page, USERS.mina);
    await expect(page.locator('.content')).toContainText('Factoring warm-up');

    // Overdue styling needs work that is past due AND not ticked off — Mina has
    // already checked the old Algebra work, and a ticked item stops nagging on
    // purpose, so use the English reading log she hasn't touched.
    await page.goto('/courses/c-eng/assignments');
    await expect(page.locator('.content')).toContainText('Reading log');
    await expect(page.locator('.due.overdue').first()).toBeVisible();
  });

  test('editing one assignment then another does not carry the first values over', async ({ page }) => {
    await page.goto('/courses/manage');
    await signInAs(page, USERS.anderson);

    const edits = page.locator('button:has-text("Edit")');
    await edits.first().click();
    const first = await page.locator('.card.subtle input').first().inputValue();
    await edits.nth(1).click();
    const second = await page.locator('.card.subtle input').first().inputValue();

    // Without a key on the form, React reuses the instance and keeps the stale
    // state — which previously saved assignment A's values onto assignment B.
    expect(second).not.toBe(first);
  });

  test('teachers see the due-date pitch on their classes page', async ({ page }) => {
    await page.goto('/courses/manage');
    await signInAs(page, USERS.anderson);
    await expect(page.locator('.callout')).toContainText('Post a due date for every assignment');
  });
});

test.describe('practice quizzes', () => {
  test('a blank middle choice does not shift the correct answer', async ({ page }) => {
    await page.goto('/courses/c-alg2/quizzes');
    await signInAs(page, USERS.mina);

    await page.click('button:has-text("Make a quiz")');
    await page.fill('.card .field input', 'Index shift check');
    await page.click('button:has-text("Create & add questions")');

    await page.fill('.card.subtle > .field input', 'Capital of France?');
    const choices = page.locator('.builder-choice input:not([type=radio])');
    await choices.nth(0).fill('Paris');
    await choices.nth(1).fill(''); // deliberately blank
    await choices.nth(2).fill('Rome');
    await choices.nth(3).fill('Madrid');
    await page.locator('.builder-choice input[type=radio]').nth(2).click(); // Rome
    await page.click('button:has-text("Add card")');

    // Compacting drops the blank choice, so the stored index must be re-mapped.
    await expect(page.locator('.quiz-question-row')).toContainText('✓ Rome');
  });

  test('practicing gives instant feedback and a retry', async ({ page }) => {
    await page.goto('/courses/c-alg2/quizzes');
    await signInAs(page, USERS.mina);
    await page.click('.quiz-card a:has-text("Practice")');

    for (const group of await page.locator('.quiz-choices').all()) {
      await group.locator('.quiz-choice input').first().click();
    }
    await page.click('button:has-text("Check answers")');

    await expect(page.locator('.practice-scoreboard')).toContainText('/');
    await expect(page.locator('.quiz-choice.correct').first()).toBeVisible();
    await expect(page.locator('button:has-text("Try again")')).toBeVisible();
  });
});

test.describe('discussions', () => {
  test('keyword search and date sort filter the list', async ({ page }) => {
    await page.goto('/discussions');
    await signInAs(page, USERS.mina);

    await page.fill('.search-input', 'osmosis');
    await expect(page.locator('.plain-list')).toContainText('Osmosis in real life');
    await expect(page.locator('.plain-list')).not.toContainText('Study group');

    await page.fill('.search-input', 'zzzznotathing');
    await expect(page.locator('.empty')).toContainText('No discussions match');

    await page.click('.search-clear');
    await page.selectOption('.disc-toolbar select >> nth=1', 'old');
    await expect(page.locator('.disc-title').first()).toBeVisible();
  });

  test('a reply posts to the thread', async ({ page }) => {
    await page.goto('/discussions');
    await signInAs(page, USERS.mina);
    await page.click('.disc-row-main >> nth=0');
    await page.fill('textarea', 'Thanks for posting this!');
    await page.click('button:has-text("Post reply")');
    await expect(page.locator('.content')).toContainText('Thanks for posting this!');
  });

  test('someone not in the course can read but not post', async ({ page }) => {
    // Jay takes AP courses, not Algebra II.
    await page.goto('/courses/c-alg2/discussions');
    await signInAs(page, USERS.jay);
    await expect(page.locator('.content')).not.toContainText('+ Discussion');
    await expect(page.locator('.course-header')).toContainText("aren't enrolled");
  });
});

test.describe('counselor', () => {
  test('scheduling puts the meeting on that student\'s calendar', async ({ page }) => {
    await page.goto('/counselor');
    await signInAs(page, USERS.rivera);

    await page.selectOption('.card select', USERS.zoe);
    const text = page.locator('.card input:not([type=date])');
    await text.nth(0).fill('College essay review');
    await text.nth(1).fill('2:00pm');
    await page.fill('.card input[type=date]', new Intl.DateTimeFormat('en-CA').format(new Date()));
    await page.click('button:has-text("Add to student calendar")');
    await expect(page.locator('.card')).toContainText('calendar ✓');

    await signInAs(page, USERS.zoe);
    await navTo(page, 'Calendar');
    await expect(page.locator('.calendar-grid')).toContainText('College essay review');
  });

  test('counselors get a reduced navigation', async ({ page }) => {
    await page.goto('/counselor');
    await signInAs(page, USERS.rivera);
    const labels = await page.locator('.rail-item .rail-label').allTextContents();
    expect(labels).toContain('Counselor');
    expect(labels).not.toContain('Courses');
  });
});

test.describe('resilience', () => {
  test('a saved account that no longer exists falls back instead of locking the app', async ({ browser }) => {
    const ctx = await browser.newContext();
    // Seed before any app code runs, as if the database had been reseeded.
    await ctx.addInitScript(() => localStorage.setItem('hwhub.currentUserId', 'ghost-id'));
    const page = await ctx.newPage();

    await page.goto('/dashboard');
    await expect(page.locator('.content')).not.toContainText('Select a user to begin');
    expect(await page.evaluate(() => localStorage.getItem('hwhub.currentUserId'))).not.toBe('ghost-id');
    await ctx.close();
  });

  test('a render crash shows a recoverable message, not a blank page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.locator('.rail-item').first().waitFor();

    // Break a method every list render depends on, then force a re-render. The
    // target route (To Do) is bundled eagerly, so the crash happens during
    // render rather than while a lazy chunk is still loading.
    await page.evaluate(() => {
      const proto = Array.prototype as unknown as { map: unknown };
      proto.map = () => { throw new Error('simulated render crash'); };
    });
    await page.click('.rail-item:has-text("To Do")').catch(() => {});

    await expect(page.locator('body')).toContainText('Something went wrong');
    await expect(page.locator('button:has-text("Reload")')).toBeVisible();
  });
});

test.describe('personal done checklist', () => {
  test('ticking an assignment marks it done and removes it from Coming up', async ({ page }) => {
    await page.goto('/homework');
    await signInAs(page, USERS.mina);

    const row = page.locator('.assignment', { hasText: 'Quadratics worksheet' }).first();
    await expect(row).not.toHaveClass(/is-done/);
    await row.locator('.done-check input').check();
    await expect(row).toHaveClass(/is-done/);

    // The dashboard's "Coming up" list is a to-do list, so it drops ticked work.
    await navTo(page, 'Dashboard');
    await expect(page.locator('.todo-panel')).not.toContainText('Quadratics worksheet');
  });

  test('the tick can be undone', async ({ page }) => {
    await page.goto('/homework');
    await signInAs(page, USERS.mina);

    // Pin the timeframe so the row is present whatever weekday the suite runs.
    await page.click('.toggle:has-text("All upcoming")');
    const row = page.locator('.assignment', { hasText: 'Essay draft' }).first();
    await row.locator('.done-check input').check();
    await expect(row).toHaveClass(/is-done/);
    await row.locator('.done-check input').uncheck();
    await expect(row).not.toHaveClass(/is-done/);
  });

  test('"Hide done" filters the list and the count tracks progress', async ({ page }) => {
    await page.goto('/homework');
    await signInAs(page, USERS.mina);
    await page.click('.toggle:has-text("All upcoming")');

    // The demo seeds some work as already done, so derive the baseline.
    const before = await page.locator('.assignment').count();
    const alreadyDone = await page.locator('.assignment.is-done').count();

    await page.locator('.assignment:not(.is-done) .done-check input').first().check();
    await expect(page.locator('.progress-row')).toContainText(
      String(alreadyDone + 1) + ' of ' + String(before),
    );

    await page.locator('.progress-row input[type=checkbox]').check();
    await expect(page.locator('.assignment')).toHaveCount(before - alreadyDone - 1);
  });

  test('teachers do not see student checkboxes', async ({ page }) => {
    await page.goto('/courses/c-alg2/assignments');
    await signInAs(page, USERS.anderson);
    await expect(page.locator('.done-check')).toHaveCount(0);
  });
});

test.describe('due-soon reminders', () => {
  test('the dashboard leads with what is about to be late', async ({ page }) => {
    await page.goto('/dashboard');
    await signInAs(page, USERS.mina);

    const panel = page.locator('.due-soon');
    await expect(panel).toBeVisible();
    // Seeded work due today and tomorrow should be listed.
    await expect(panel).toContainText('Quadratics worksheet');
    await expect(panel.locator('.due')).toContainText([/Due today|Overdue/]);
  });

  test('ticking work off removes it from the warning', async ({ page }) => {
    await page.goto('/dashboard');
    await signInAs(page, USERS.mina);
    await expect(page.locator('.due-soon')).toContainText('Quadratics worksheet');

    await navTo(page, 'To Do');
    await page
      .locator('.assignment', { hasText: 'Quadratics worksheet' })
      .first()
      .locator('.done-check input')
      .check();

    await navTo(page, 'Dashboard');
    await expect(page.locator('.content')).not.toContainText('Quadratics worksheet');
  });

  test('browser reminders can be switched on', async ({ page, context }) => {
    await context.grantPermissions(['notifications']);
    await page.goto('/dashboard');
    await signInAs(page, USERS.mina);

    await page.click('button:has-text("Turn on reminders")');
    await expect(page.locator('button:has-text("Reminders on")')).toBeVisible();
  });

  test('teachers do not get the student reminder panel', async ({ page }) => {
    await page.goto('/dashboard');
    await signInAs(page, USERS.anderson);
    await expect(page.locator('.due-soon')).toHaveCount(0);
  });
});
