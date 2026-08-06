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
    // The .meta line names the correct answer; it must be Rome, not the blank.
    const stored = page.locator('.quiz-question-row .meta');
    await expect(stored).toContainText('Rome');
    await expect(stored).not.toContainText('Paris');
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

    // Scoped to this card — the availability panel above it has a form too.
    const form = page.locator('.card', { hasText: 'Schedule a meeting' });
    await form.locator('select').selectOption(USERS.zoe);
    const text = form.locator('input:not([type=date])');
    await text.nth(0).fill('College essay review');
    await text.nth(1).fill('2:00pm');
    await form.locator('input[type=date]').fill(new Intl.DateTimeFormat('en-CA').format(new Date()));
    await page.click('button:has-text("Add to student calendar")');
    await expect(form).toContainText("Added to Zoe's calendar");

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

test.describe('calendar export', () => {
  test('downloads a valid .ics containing the student\'s dates', async ({ page }) => {
    await page.goto('/calendar');
    await signInAs(page, USERS.mina);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export")'),
    ]);
    expect(download.suggestedFilename()).toBe('homework-hub.ics');

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const ics = Buffer.concat(chunks).toString('utf8');

    // Structure calendar apps require.
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true);
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
    expect(ics).toContain('VERSION:2.0');
    expect(ics.includes('\r\n')).toBe(true);

    // Every event opened must be closed.
    const opens = (ics.match(/BEGIN:VEVENT/g) ?? []).length;
    const closes = (ics.match(/END:VEVENT/g) ?? []).length;
    expect(opens).toBe(closes);
    expect(opens).toBeGreaterThan(0);

    // Content: course work and a personal event, with all-day dates.
    expect(ics).toContain('Quadratics worksheet');
    expect(ics).toContain('Dentist appointment');
    expect(ics).toMatch(/DTSTART;VALUE=DATE:\d{8}/);

    // No line may exceed the 75-octet limit once folded.
    const tooLong = ics.split('\r\n').filter((l) => l.length > 75);
    expect(tooLong, tooLong.join(' | ')).toEqual([]);
  });
});

test.describe('bulk assignment entry', () => {
  test('a pasted list posts every valid row and flags the bad ones', async ({ page }) => {
    await page.goto('/courses/c-alg2/assignments');
    await signInAs(page, USERS.anderson);
    await page.click('button:has-text("Add several")');

    await page.fill(
      '#bulk-paste',
      [
        'Chapter 7 worksheet, 2026-11-06',
        'Chapter 7 quiz, 2026-11-13',
        'Broken row with no date',
      ].join('\n'),
    );

    // The preview separates what will post from what needs fixing.
    await expect(page.locator('.bulk-preview')).toContainText('2 ready');
    await expect(page.locator('.bulk-preview')).toContainText('1 need fixing');
    await expect(page.locator('.bulk-row.has-error')).toHaveCount(1);

    await page.click('button:has-text("Post 2 assignments")');
    await expect(page.locator('.card')).toContainText('Posted 2 assignments');
    await expect(page.locator('.content')).toContainText('Chapter 7 worksheet');
    await expect(page.locator('.content')).toContainText('Chapter 7 quiz');
    // The malformed line must not have been posted.
    await expect(page.locator('.content')).not.toContainText('Broken row');
  });

  test('a weekly repeat creates one dated assignment per week', async ({ page }) => {
    await page.goto('/courses/c-alg2/assignments');
    await signInAs(page, USERS.anderson);
    await page.click('button:has-text("Add several")');
    await page.click('.toggle:has-text("Repeats weekly")');

    await page.fill('#repeat-title', 'Weekly vocab quiz');
    await page.selectOption('#repeat-day', '5'); // Friday
    await page.fill('#repeat-from', '2026-11-02'); // Monday
    await page.fill('#repeat-until', '2026-11-30');

    // Fridays in that window: Nov 6, 13, 20, 27.
    await expect(page.locator('.bulk-preview')).toContainText('Creates 4 Fridays');
    await page.click('button:has-text("Post 4 dates")');

    await expect(page.locator('.card')).toContainText('Posted 4 assignments');
    await expect(page.locator('.content')).toContainText('Weekly vocab quiz 1');
    await expect(page.locator('.content')).toContainText('Weekly vocab quiz 4');
  });

  test('students never see the bulk tools', async ({ page }) => {
    await page.goto('/courses/c-alg2/assignments');
    await signInAs(page, USERS.mina);
    await expect(page.locator('button:has-text("Add several")')).toHaveCount(0);
  });
});

test.describe('counselor meeting requests', () => {
  test('a student asks and the counselor books it onto their calendar', async ({ page }) => {
    await page.goto('/dashboard');
    await signInAs(page, USERS.mina);

    await page.click('button:has-text("Request a meeting")');
    await page.fill('#req-reason', 'Help choosing junior year classes');
    await page.fill('#req-when', 'Tuesday lunch');
    await page.click('button:has-text("Send request")');
    await expect(page.locator('.chip.request-pending')).toBeVisible();

    // The counselor sees it queued and books a time.
    await signInAs(page, USERS.rivera);
    await navTo(page, 'Counselor');
    const queue = page.locator('.section', { hasText: 'Requests from students' });
    await expect(queue).toContainText('Help choosing junior year classes');
    await queue.locator('li', { hasText: 'Help choosing' }).locator('button:has-text("Respond")').click();

    await page.fill('#resp-time', '12:30pm');
    await page.fill('#resp-loc', 'Room 102');
    await page.click('button:has-text("Book it")');

    // Booking must reach the student's calendar, not just change a status.
    await signInAs(page, USERS.mina);
    await navTo(page, 'Calendar');
    await expect(page.locator('.calendar-grid')).toContainText('Counselor meeting');

    await navTo(page, 'Dashboard');
    await expect(page.locator('.chip.request-accepted')).toBeVisible();
  });

  test('declining tells the student why instead of leaving them waiting', async ({ page }) => {
    await page.goto('/counselor');
    await signInAs(page, USERS.rivera);

    // Zoe's request is seeded as pending.
    const queue = page.locator('.section', { hasText: 'Requests from students' });
    await queue.locator('li', { hasText: 'AP classes' }).locator('button:has-text("Respond")').click();
    await page.fill('#resp-note', 'Out this week — try next Monday');
    await page.click('button:has-text("Decline")');

    await signInAs(page, USERS.zoe);
    await navTo(page, 'Dashboard');
    await expect(page.locator('.chip.request-declined')).toBeVisible();
    await expect(page.locator('.content')).toContainText('try next Monday');
  });

  test('teachers are not offered the counselor request panel', async ({ page }) => {
    await page.goto('/dashboard');
    await signInAs(page, USERS.anderson);
    await expect(page.locator('button:has-text("Request a meeting")')).toHaveCount(0);
  });
});

test.describe('parent accounts', () => {
  test('a guardian sees their student\'s upcoming work and meetings', async ({ page }) => {
    await page.goto('/dashboard');
    await signInAs(page, USERS.kim);

    // Parents land on their own screen, named for the student they follow.
    await expect(page).toHaveURL(/\/family$/);
    await expect(page.locator('.page-head')).toContainText('Mina');
    await expect(page.locator('.section', { hasText: 'Coming up' })).toContainText(
      'Cell organelles',
    );
    await expect(page.locator('.section', { hasText: 'Counseling meetings' })).toContainText(
      'Counselor check-in',
    );
  });

  test('the view is read-only — no ticking, posting, or discussions', async ({ page }) => {
    await page.goto('/family');
    await signInAs(page, USERS.kim);

    await expect(page.locator('.done-check')).toHaveCount(0);
    await expect(page.locator('button:has-text("Request a meeting")')).toHaveCount(0);

    // The nav offers exactly one destination.
    const labels = await page.locator('.rail-item .rail-label').allTextContents();
    expect(labels).toEqual(['Family']);
  });

  test('work the student ticked off is shown as done but not editable', async ({ page }) => {
    await page.goto('/family');
    await signInAs(page, USERS.kim);
    // Mina has already ticked the cell organelles reading in the seed data.
    const row = page.locator('.list-row', { hasText: 'Cell organelles' });
    await expect(row).toHaveClass(/is-done/);
    await expect(row.locator('input')).toHaveCount(0);
  });
});

test.describe('course files', () => {
  test('a teacher uploads a real file and it can be opened again', async ({ page }) => {
    await page.goto('/courses/c-alg2/files');
    await signInAs(page, USERS.anderson);

    await page.setInputFiles('input[type="file"]', {
      name: 'unit5-review.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 pretend worksheet'.repeat(200)),
    });

    const row = page.locator('tr', { hasText: 'unit5-review.pdf' });
    await expect(row).toBeVisible();
    await expect(row).toContainText('5 KB');
    await expect(row).toContainText('Ms. Anderson');

    // Uploaded files are openable; the seeded metadata-only rows are not.
    await expect(row.locator('button.linklike')).toBeVisible();
    const seeded = page.locator('tr', { hasText: 'unit4-formula-sheet.pdf' });
    await expect(seeded.locator('button.linklike')).toHaveCount(0);
  });

  test('an oversized file is refused with a reason, not a silent failure', async ({ page }) => {
    await page.goto('/courses/c-alg2/files');
    await signInAs(page, USERS.anderson);

    await page.setInputFiles('input[type="file"]', {
      name: 'whole-textbook.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(21 * 1024 * 1024, 1),
    });

    await expect(page.locator('.banner.error')).toContainText('The limit is 20 MB');
    await expect(page.locator('tr', { hasText: 'whole-textbook.pdf' })).toHaveCount(0);
  });

  test('deleting removes the file from the list', async ({ page }) => {
    await page.goto('/courses/c-alg2/files');
    await signInAs(page, USERS.anderson);

    await page.setInputFiles('input[type="file"]', {
      name: 'scratch.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('temporary'),
    });
    const row = page.locator('tr', { hasText: 'scratch.txt' });
    await expect(row).toBeVisible();

    await row.locator('button:has-text("Delete")').click();
    await expect(row).toHaveCount(0);
  });

  test('students can read the file list but not upload to it', async ({ page }) => {
    await page.goto('/courses/c-alg2/files');
    await signInAs(page, USERS.mina);

    await expect(page.locator('input[type="file"]')).toHaveCount(0);
    await expect(page.locator('button:has-text("Delete")')).toHaveCount(0);
    await expect(page.locator('tr', { hasText: 'unit4-formula-sheet.pdf' })).toBeVisible();
  });
});

test.describe('class question bank', () => {
  test('practices every card the class made, shuffled and de-duplicated', async ({ page }) => {
    await page.goto('/courses/c-alg2/quizzes');
    await signInAs(page, USERS.mina);

    // Two quizzes, 8 cards written, but one is a duplicate of another.
    const bank = page.locator('.bank-card');
    await expect(bank).toContainText('7 cards');
    await bank.locator('a:has-text("Practice the bank")').click();

    await expect(page.locator('h2')).toContainText('question bank');
    await expect(page.locator('h2 + p.sub')).toContainText('shuffled from 2 quizzes');
    await expect(page.locator('.card .quiz-choices')).toHaveCount(7);

    // Cards say which quiz they came from, so a student can go find that quiz.
    await expect(page.locator('.content')).toContainText('Quadratics self-check');
    await expect(page.locator('.content')).toContainText('Factoring speed round');
  });

  test('a bank round still scores answers', async ({ page }) => {
    await page.goto('/courses/c-alg2/quizzes/bank/practice');
    await signInAs(page, USERS.mina);

    // Answer every card with its first choice, right or wrong.
    const cards = page.locator('.card:has(.quiz-choices)');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      await cards.nth(i).locator('.quiz-choice input').first().check();
    }
    await page.click('button:has-text("Check answers")');
    await expect(page.locator('.practice-scoreboard')).toContainText(`/ ${count}`);
    await expect(page.locator('button:has-text("Reshuffle")')).toBeVisible();
  });

  test('a new quiz can pull in cards other students already wrote', async ({ page }) => {
    // Jay isn't in Algebra II, so use a student who is.
    await page.goto('/courses/c-alg2/quizzes');
    await signInAs(page, USERS.mina);

    await page.click('button:has-text("Make a quiz")');
    await page.fill('input[aria-label="Quiz title"]', 'Unit 4 cram');
    await page.click('button:has-text("Create & add questions")');

    const picker = page.locator('.card', { hasText: 'From the class bank' });
    await picker.locator('button:has-text("Browse")').click();
    await picker.locator('li', { hasText: 'Factor: x² − 9' }).locator('button:has-text("Add")').click();

    // The copy lands in the new quiz, and the bank stops offering it.
    await expect(page.locator('.quiz-question-row', { hasText: 'Factor: x² − 9' })).toHaveCount(1);
    await page.click('button:has-text("Done")');
    await expect(
      page.locator('.quiz-card', { hasText: 'Unit 4 cram' }),
    ).toContainText('1 card');
  });

  test('the bank is per class, not the whole school', async ({ page }) => {
    await page.goto('/courses/c-bio/quizzes');
    await signInAs(page, USERS.mina);

    await expect(page.locator('.bank-card')).toContainText('3 cards');
    await page.click('a:has-text("Practice the bank")');
    await expect(page.locator('.content')).not.toContainText('discriminant');
  });
});

test.describe('counselor availability', () => {
  test('a student books a posted time and it lands on their calendar', async ({ page }) => {
    await page.goto('/dashboard');
    await signInAs(page, USERS.mina);

    await page.click('button:has-text("Request a meeting")');
    await page.fill('#req-reason', 'Course selection questions');
    // Picking a posted time books it outright — no second approval step.
    await page.selectOption('#req-slot', { index: 1 });
    await page.click('button:has-text("Book this time")');
    await expect(page.locator('.chip.request-accepted')).toBeVisible();

    await navTo(page, 'Calendar');
    await expect(page.locator('.calendar-grid')).toContainText('Counselor meeting');
  });

  test('a booked time stops being offered to the next student', async ({ page }) => {
    await page.goto('/dashboard');
    await signInAs(page, USERS.mina);

    await page.click('button:has-text("Request a meeting")');
    const before = await page.locator('#req-slot option').count();
    await page.fill('#req-reason', 'Taking the first open time');
    await page.selectOption('#req-slot', { index: 1 });
    await page.click('button:has-text("Book this time")');

    await signInAs(page, USERS.zoe);
    await page.click('button:has-text("Request a meeting")');
    await expect(page.locator('#req-slot option')).toHaveCount(before - 1);
  });

  test('with no time picked it is still just a request the counselor answers', async ({ page }) => {
    await page.goto('/dashboard');
    await signInAs(page, USERS.mina);

    await page.click('button:has-text("Request a meeting")');
    await page.fill('#req-reason', 'Something private, whenever works');
    await page.fill('#req-when', 'Any afternoon');
    await page.click('button:has-text("Send request")');
    await expect(page.locator('.chip.request-pending')).toBeVisible();
  });

  test('a counselor posts a weekly time and sees who booked one', async ({ page }) => {
    await page.goto('/counselor');
    await signInAs(page, USERS.rivera);

    const panel = page.locator('.section', { hasText: 'My open times' });
    await expect(panel).toContainText('Booked by Leo');

    const openBefore = await panel.locator('button:has-text("Remove")').count();
    await page.fill('#slot-time', 'Period 2 (9:05)');
    await page.click('button:has-text("Post this time")');
    await expect(panel.locator('button:has-text("Remove")')).toHaveCount(openBefore + 1);

    // The same time twice would let two students each claim it.
    await page.fill('#slot-time', 'Period 2 (9:05)');
    await page.click('button:has-text("Post this time")');
    await expect(panel).toContainText('already on your list');
  });

  test('students never see the availability editor', async ({ page }) => {
    await page.goto('/dashboard');
    await signInAs(page, USERS.mina);
    await expect(page.locator('#slot-time')).toHaveCount(0);
  });
});

test.describe('weekly digest', () => {
  test('previews the week ahead the way the email will read it', async ({ page }) => {
    await page.goto('/dashboard');
    await signInAs(page, USERS.mina);

    await page.locator('.section', { hasText: 'Weekly email' }).locator('button:has-text("Preview")').click();
    const preview = page.locator('.digest-preview');

    await expect(preview).toContainText('due this week');
    await expect(preview).toContainText('Hi Mina');
    // Addressed by first name — "(Student)" is an account label, not a name.
    await expect(preview).not.toContainText('(Student)');

    // Her classes only: English 10 is hers, AP Calculus is Jay's.
    await expect(preview).toContainText('Essay draft');
    await expect(preview).not.toContainText('Limits practice set');

    // The biology reading is due this week but she already ticked it off.
    await expect(preview).not.toContainText('Cell organelles reading');
  });

  test('work already ticked off is left out of the email', async ({ page }) => {
    await page.goto('/homework');
    await signInAs(page, USERS.mina);

    // Week and month are calendar ranges, so widen fully to reach later work.
    await page.click('.toggle:has-text("All upcoming")');
    const row = page.locator('.assignment', { hasText: 'Preterite' }).first();
    await row.locator('.done-check input').check();

    await navTo(page, 'Dashboard');
    await page.locator('.section', { hasText: 'Weekly email' }).locator('button:has-text("Preview")').click();
    // Mailing someone about work they've finished is how the email gets ignored.
    await expect(page.locator('.digest-preview')).not.toContainText('Preterite');
  });

  test('a student can turn the email off and back on', async ({ page }) => {
    await page.goto('/dashboard');
    await signInAs(page, USERS.mina);

    const panel = page.locator('.section', { hasText: 'Weekly email' });
    await expect(panel).toContainText('Every Sunday evening');
    await panel.locator('button:has-text("Turn it off")').click();
    await expect(panel).toContainText("not getting the Sunday email");

    await panel.locator('button:has-text("Turn it back on")').click();
    await expect(panel).toContainText('Every Sunday evening');
  });

  test('teachers are not offered a student digest', async ({ page }) => {
    await page.goto('/dashboard');
    await signInAs(page, USERS.anderson);
    await expect(page.locator('.section', { hasText: 'Weekly email' })).toHaveCount(0);
  });
});

/**
 * The subject colour used to be written straight into a `style` attribute at
 * every call site. It now travels as a `--accent` custom property and the rule
 * that uses it lives in the stylesheet — a refactor a typecheck can't catch,
 * since a stripe that silently stops being drawn is still valid TypeScript.
 */
test.describe('subject colour', () => {
  // Both rules carry a fallback, which is right for the stylesheet and useless
  // for a test: with --accent missing the stripe is still 4px, just grey. So
  // these assert the subject's own hue arrives, not merely that something did.
  const MATHS = 'rgb(58, 98, 168)'; // #3a62a8, the Math swatch

  test('assignment cards still carry their subject stripe', async ({ page }) => {
    await page.goto('/homework');
    await signInAs(page, USERS.mina);

    const card = page.locator('.assignment', { hasText: 'Quadratics worksheet' }).first();
    await expect(card).toHaveClass(/accent-left/);
    await expect(card).toHaveCSS('border-left-width', '4px');
    // Algebra II is a Math course, so the stripe is the Math swatch and nothing
    // else — this is the whole chain: value set, property resolved, rule fired.
    await expect(card).toHaveCSS('border-left-color', MATHS);
  });

  test('calendar chips are tinted from the same property', async ({ page }) => {
    await page.goto('/calendar');
    await signInAs(page, USERS.mina);

    const chip = page
      .locator('.calendar-item.is-assignment', { hasText: 'Quadratics worksheet' })
      .first();
    await expect(chip).toHaveCSS('border-color', MATHS);

    // The fill is color-mix()'d, which computes to a color(srgb …) string
    // rather than rgba(), so paint it and read the pixel back.
    const [r, g, b, a] = await chip.evaluate((el) => {
      const c = document.createElement('canvas').getContext('2d')!;
      c.fillStyle = getComputedStyle(el).backgroundColor;
      c.fillRect(0, 0, 1, 1);
      return Array.from(c.getImageData(0, 0, 1, 1).data);
    });
    // Same hue as the stripe, laid on as a wash rather than a flat block.
    // Within a few points per channel: the canvas round-trips through 8-bit
    // premultiplied alpha, so an exact match would be testing the rounding.
    for (const [got, want] of [[r, 58], [g, 98], [b, 168]]) {
      expect(Math.abs(got - want)).toBeLessThan(5);
    }
    expect(a / 255).toBeGreaterThan(0.05);
    expect(a / 255).toBeLessThan(0.4);
  });
});

test.describe('empty states', () => {
  test('a tab with nothing in it says what belongs there', async ({ page }) => {
    // Spanish III has no quizzes, which is the ordinary "nobody has made one
    // yet" case rather than an error.
    await page.goto('/courses/c-span/quizzes');
    await signInAs(page, USERS.mina);

    const empty = page.locator('.empty.is-composed');
    await expect(empty).toBeVisible();
    await expect(empty.locator('.empty-title')).toHaveText('No practice quizzes yet');
    // The mark is decoration; it must not be read out as content.
    await expect(empty.locator('.empty-mark')).toHaveAttribute('aria-hidden', 'true');
    // And the way out is right there, not somewhere else on the page.
    await expect(page.locator('button:has-text("Make a quiz")')).toBeVisible();
  });

  test('a genuine error stays a plain line, not a decorated panel', async ({ page }) => {
    await page.goto('/courses/c-nope');
    await signInAs(page, USERS.mina);
    // Dressing "not found" up the same way would make a broken link look like
    // a normal, expected state.
    await expect(page.locator('.empty')).toContainText('Course not found');
    await expect(page.locator('.empty.is-composed')).toHaveCount(0);
  });
});
