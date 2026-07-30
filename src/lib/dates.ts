// Date helpers for the homework feed filters and the calendar grid.
// All assignment dates are stored as YYYY-MM-DD strings.

export type Timeframe = 'today' | 'week' | 'month' | 'year' | 'upcoming';

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  today: 'Today',
  week: 'This week',
  month: 'This month',
  year: 'This year',
  upcoming: 'All upcoming',
};

/**
 * Format a Date as YYYY-MM-DD in the *local* timezone.
 * Never use toISOString() here — it converts to UTC, which shifts the date by a
 * day for most of the world and disagrees with parseISO()/monthGrid() below.
 */
export function toISODate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function today(): string {
  return toISODate(new Date());
}

/** Parse a YYYY-MM-DD string as a local date (avoids UTC off-by-one). */
export function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Sunday-start week bounds for the week containing `ref`. */
function weekBounds(ref: Date): [Date, Date] {
  const start = new Date(ref);
  start.setDate(ref.getDate() - ref.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return [start, end];
}

/**
 * True when `dueISO` falls within the given timeframe relative to now.
 * `today` and windowed frames are inclusive of the current day; `upcoming`
 * means anything due today or later.
 */
export function inTimeframe(dueISO: string, frame: Timeframe): boolean {
  const due = parseISO(dueISO);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  switch (frame) {
    case 'today':
      return dueISO === today();
    case 'week': {
      const [start, end] = weekBounds(now);
      return due >= start && due <= end;
    }
    case 'month':
      return (
        due.getFullYear() === now.getFullYear() &&
        due.getMonth() === now.getMonth()
      );
    case 'year':
      return due.getFullYear() === now.getFullYear();
    case 'upcoming':
      return due >= now;
  }
}

export interface CalendarCell {
  date: Date;
  iso: string;
  inMonth: boolean;
  isToday: boolean;
}

/** Build a 6-row (42-cell) month grid, Sunday-first, for the given month. */
export function monthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay()); // back up to Sunday
  const todayISO = today();

  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    cells.push({
      date,
      iso: toISODate(date),
      inMonth: date.getMonth() === month,
      isToday: toISODate(date) === todayISO,
    });
  }
  return cells;
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Friendly relative label for a due date, e.g. "Today", "Tomorrow", "in 3 days". */
export function dueLabel(dueISO: string): string {
  const due = parseISO(dueISO);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - now.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays === -1) return 'Due yesterday';
  if (diffDays < 0) return `Overdue by ${-diffDays} days`;
  if (diffDays < 7) return `Due in ${diffDays} days`;
  return `Due ${MONTH_NAMES[due.getMonth()].slice(0, 3)} ${due.getDate()}`;
}
