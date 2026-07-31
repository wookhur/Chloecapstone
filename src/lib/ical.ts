import { parseISO } from './dates';
import { CALENDAR_CATEGORIES, type Assignment, type CalendarEvent, type ClassInfo } from './types';

/**
 * Export a student's dates as an .ics file they can open in Apple or Google
 * Calendar — the calendar they already check every day.
 *
 * Everything is emitted as an all-day VEVENT, because assignments carry a due
 * date but no time. A *subscribable* feed (webcal://) that keeps updating would
 * need a server to host it; this produces a file, which is honest about being a
 * snapshot of the moment it was downloaded.
 */

/** Escape per RFC 5545: backslash, semicolon, comma and newlines are special. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** YYYYMMDD in local terms, matching how the app stores dates. */
function icsDate(iso: string): string {
  return iso.replace(/-/g, '');
}

/** The day after — DTEND is exclusive for all-day events. */
function icsDateEnd(iso: string): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function stamp(): string {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Long lines must be folded at 75 octets, continued with a leading space.
 * Calendar apps reject or truncate lines that run over.
 */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    parts.push(' ' + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest) parts.push(' ' + rest);
  return parts.join('\r\n');
}

interface BuildInput {
  assignments: Assignment[];
  events: CalendarEvent[];
  classById: (id: string) => ClassInfo | undefined;
  calendarName?: string;
}

export function buildICS({
  assignments,
  events,
  classById,
  calendarName = 'Homework Hub',
}: BuildInput): string {
  const now = stamp();
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Homework Hub//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
  ];

  for (const a of assignments) {
    const cls = classById(a.class_id);
    const summary = cls ? `${cls.name}: ${a.title}` : a.title;
    lines.push(
      'BEGIN:VEVENT',
      `UID:assignment-${a.id}@homeworkhub`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${icsDate(a.due_date)}`,
      `DTEND;VALUE=DATE:${icsDateEnd(a.due_date)}`,
      fold(`SUMMARY:${escapeText(summary)}`),
      fold(`DESCRIPTION:${escapeText(a.description ?? `${a.type} due`)}`),
      'END:VEVENT',
    );
  }

  for (const e of events) {
    const category = CALENDAR_CATEGORIES.find((c) => c.key === e.category);
    lines.push(
      'BEGIN:VEVENT',
      `UID:event-${e.id}@homeworkhub`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${icsDate(e.date)}`,
      `DTEND;VALUE=DATE:${icsDateEnd(e.date)}`,
      fold(`SUMMARY:${escapeText(e.title)}`),
      fold(`DESCRIPTION:${escapeText(e.note ?? category?.label ?? '')}`),
      `CATEGORIES:${escapeText(category?.label ?? 'Event')}`,
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  // RFC 5545 requires CRLF line endings.
  return lines.join('\r\n') + '\r\n';
}

/** Trigger a download of the given calendar content. */
export function downloadICS(content: string, filename = 'homework-hub.ics') {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
