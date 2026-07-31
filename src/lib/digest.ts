/**
 * The Sunday-evening email: everything due in the week ahead, in one message.
 *
 * Reminders in the app only help people who open the app. The students most
 * likely to miss a deadline are exactly the ones not opening it, so the week's
 * work has to go to them.
 *
 * This file is deliberately self-contained — no imports. The Supabase Edge
 * Function that actually sends the mail runs on Deno and imports it directly,
 * so the email and the in-app preview can never drift apart. Keep it free of
 * browser APIs and of extensionless imports.
 */

export interface DigestAssignment {
  id: string;
  class_id: string;
  title: string;
  due_date: string;
  type: string;
}

export interface DigestEvent {
  title: string;
  date: string;
  category: string;
  note: string | null;
}

export interface DigestInput {
  studentName: string;
  /** Assignments for the classes this student is actually in. */
  assignments: DigestAssignment[];
  /** Assignment ids the student has already ticked off. */
  doneIds: string[];
  classNames: Record<string, string>;
  events: DigestEvent[];
  /** First day the digest covers, YYYY-MM-DD. */
  weekStart: string;
  days?: number;
}

export interface DigestItem {
  title: string;
  detail: string;
  /** Tests and projects are what people wish they'd started earlier. */
  emphasis: boolean;
}

export interface DigestDay {
  date: string;
  label: string;
  items: DigestItem[];
}

export interface Digest {
  subject: string;
  greeting: string;
  days: DigestDay[];
  itemCount: number;
  text: string;
  html: string;
  /** Nothing due — the caller should skip sending rather than mail an empty week. */
  empty: boolean;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Parse YYYY-MM-DD as a local date. Never `new Date(str)`, which reads as UTC. */
function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function toISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

function dayLabel(iso: string): string {
  const d = parseISO(iso);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** First name only — "Mina (Student)" is an account label, not how to address someone. */
export function firstName(name: string): string {
  return name.replace(/\s*\((student|teacher|counselor|parent|admin)\)\s*$/i, '').split(' ')[0];
}

export function buildDigest(input: DigestInput): Digest {
  const days = input.days ?? 7;
  const start = input.weekStart;
  const end = addDays(start, days - 1);
  const done = new Set(input.doneIds);

  const byDate = new Map<string, DigestItem[]>();
  const push = (date: string, item: DigestItem) => {
    const list = byDate.get(date);
    if (list) list.push(item);
    else byDate.set(date, [item]);
  };

  for (const a of input.assignments) {
    if (a.due_date < start || a.due_date > end) continue;
    // Work they've already ticked off shouldn't come back in an email — that's
    // the fastest way to teach someone to ignore the email.
    if (done.has(a.id)) continue;
    push(a.due_date, {
      title: a.title,
      detail: input.classNames[a.class_id] ?? 'Class',
      emphasis: a.type === 'test' || a.type === 'quiz' || a.type === 'project',
    });
  }

  for (const e of input.events) {
    if (e.date < start || e.date > end) continue;
    if (e.category !== 'counseling' && e.category !== 'exam') continue;
    push(e.date, {
      title: e.title,
      detail: e.note ?? (e.category === 'counseling' ? 'Counseling' : 'Exam'),
      emphasis: true,
    });
  }

  const dayList: DigestDay[] = [...byDate.keys()]
    .sort()
    .map((date) => ({
      date,
      label: dayLabel(date),
      items: byDate.get(date)!.sort((a, b) => Number(b.emphasis) - Number(a.emphasis)),
    }));

  const itemCount = dayList.reduce((n, d) => n + d.items.length, 0);
  const who = firstName(input.studentName);
  const empty = itemCount === 0;

  const subject = empty
    ? `Nothing due this week, ${who}`
    : `${itemCount} thing${itemCount === 1 ? '' : 's'} due this week`;

  const greeting = empty
    ? `Hi ${who} — nothing is due in the next ${days} days. Enjoy it.`
    : `Hi ${who} — here's what's due between ${dayLabel(start)} and ${dayLabel(end)}.`;

  const textLines = [greeting, ''];
  for (const d of dayList) {
    textLines.push(d.label);
    for (const item of d.items) {
      textLines.push(`  ${item.emphasis ? '*' : '-'} ${item.title} (${item.detail})`);
    }
    textLines.push('');
  }
  textLines.push('Homework Hub — due dates only. Grades live in the school system.');

  const html = [
    `<p>${escapeHtml(greeting)}</p>`,
    ...dayList.map(
      (d) =>
        `<h3 style="margin:16px 0 4px;font:600 15px system-ui">${escapeHtml(d.label)}</h3>` +
        '<ul style="margin:0;padding-left:20px">' +
        d.items
          .map(
            (i) =>
              `<li style="margin:2px 0">${
                i.emphasis ? `<strong>${escapeHtml(i.title)}</strong>` : escapeHtml(i.title)
              } <span style="color:#666">— ${escapeHtml(i.detail)}</span></li>`,
          )
          .join('') +
        '</ul>',
    ),
    '<p style="margin-top:20px;color:#666;font-size:13px">Homework Hub — due dates only. Grades live in the school system.</p>',
  ].join('\n');

  return {
    subject,
    greeting,
    days: dayList,
    itemCount,
    text: textLines.join('\n'),
    html,
    empty,
  };
}
