import { parseISO, today, toISODate } from './dates';
import type { Assignment } from './types';

/**
 * Due-date reminders.
 *
 * These run in the browser: the app can only nudge someone while it is open, or
 * through a notification the browser shows on its behalf. Emailed digests would
 * need a scheduled job on a server (e.g. a Supabase Edge Function on a cron),
 * which is out of scope for a client-only deployment.
 */

const PERMISSION_KEY = 'hwhub.reminders.enabled';
/** Notifications already sent, so reopening the app doesn't re-alert. */
const SENT_KEY = 'hwhub.reminders.sent';
/** How far ahead counts as "due soon". */
export const SOON_DAYS = 2;

export function daysUntil(dueISO: string): number {
  const due = parseISO(dueISO);
  const now = parseISO(today());
  return Math.round((due.getTime() - now.getTime()) / 86_400_000);
}

/** Work that is overdue or lands within the next couple of days. */
export function dueSoon(assignments: Assignment[]): Assignment[] {
  return assignments
    .filter((a) => daysUntil(a.due_date) <= SOON_DAYS)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
}

export function reminderLabel(dueISO: string): string {
  const days = daysUntil(dueISO);
  if (days < 0) return days === -1 ? 'Was due yesterday' : `Overdue by ${-days} days`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

// --- Browser notifications ---------------------------------------------------

export const notificationsSupported = typeof Notification !== 'undefined';

export function notificationsEnabled(): boolean {
  if (!notificationsSupported) return false;
  return Notification.permission === 'granted' && localStorage.getItem(PERMISSION_KEY) === 'on';
}

/** Ask the browser for permission; resolves to whether reminders are now on. */
export async function enableNotifications(): Promise<boolean> {
  if (!notificationsSupported) return false;
  const permission =
    Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  const granted = permission === 'granted';
  localStorage.setItem(PERMISSION_KEY, granted ? 'on' : 'off');
  return granted;
}

export function disableNotifications() {
  localStorage.setItem(PERMISSION_KEY, 'off');
}

function sentToday(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(SENT_KEY) ?? '{}') as {
      date?: string;
      ids?: string[];
    };
    // Yesterday's record is irrelevant — a new day means new reminders.
    return raw.date === toISODate(new Date()) ? new Set(raw.ids ?? []) : new Set();
  } catch {
    return new Set();
  }
}

function rememberSent(ids: Set<string>) {
  localStorage.setItem(
    SENT_KEY,
    JSON.stringify({ date: toISODate(new Date()), ids: [...ids] }),
  );
}

/**
 * Notify once per assignment per day about anything due soon. Returns how many
 * notifications were shown.
 */
export function notifyDueSoon(assignments: Assignment[]): number {
  if (!notificationsEnabled()) return 0;

  const already = sentToday();
  const pending = dueSoon(assignments).filter((a) => !already.has(a.id));
  if (pending.length === 0) return 0;

  // One combined notification beats five separate ones on a phone.
  if (pending.length === 1) {
    const a = pending[0];
    new Notification(reminderLabel(a.due_date), { body: a.title, tag: `hwhub-${a.id}` });
  } else {
    new Notification(`${pending.length} assignments due soon`, {
      body: pending.slice(0, 4).map((a) => a.title).join('\n'),
      tag: 'hwhub-due-soon',
    });
  }

  pending.forEach((a) => already.add(a.id));
  rememberSent(already);
  return pending.length;
}
