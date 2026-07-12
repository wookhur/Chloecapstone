import { useState } from 'react';
import {
  MONTH_NAMES,
  WEEKDAY_NAMES,
  monthGrid,
} from '../lib/dates';
import { subjectColor } from '../lib/subjectColor';
import {
  CALENDAR_CATEGORIES,
  type Assignment,
  type CalendarEvent,
  type ClassInfo,
} from '../lib/types';

interface Props {
  assignments: Assignment[];
  events: CalendarEvent[];
  classById: (id: string) => ClassInfo | undefined;
  onSelectAssignment?: (a: Assignment) => void;
  onSelectEvent?: (e: CalendarEvent) => void;
  /** Called when a day cell's "+" is clicked, to add an event on that date. */
  onAddOnDate?: (iso: string) => void;
}

const categoryStyle = (cat: CalendarEvent['category']) =>
  CALENDAR_CATEGORIES.find((c) => c.key === cat) ?? CALENDAR_CATEGORIES[0];

/** A month calendar that shows assignments due and hand-added events per day. */
export default function Calendar({
  assignments,
  events,
  classById,
  onSelectAssignment,
  onSelectEvent,
  onAddOnDate,
}: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const cells = monthGrid(year, month);

  const assignmentsByDay = new Map<string, Assignment[]>();
  for (const a of assignments) {
    const list = assignmentsByDay.get(a.due_date) ?? [];
    list.push(a);
    assignmentsByDay.set(a.due_date, list);
  }
  const eventsByDay = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const list = eventsByDay.get(e.date) ?? [];
    list.push(e);
    eventsByDay.set(e.date, list);
  }

  const step = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  return (
    <div className="calendar">
      <div className="calendar-head">
        <button className="btn ghost small" onClick={() => step(-1)}>‹ Prev</button>
        <div className="inline" style={{ gap: '0.5rem' }}>
          <h2>{MONTH_NAMES[month]} {year}</h2>
          <button className="btn secondary small" onClick={goToday}>Today</button>
        </div>
        <button className="btn ghost small" onClick={() => step(1)}>Next ›</button>
      </div>

      <div className="calendar-grid">
        {WEEKDAY_NAMES.map((w) => (
          <div className="calendar-weekday" key={w}>{w}</div>
        ))}
        {cells.map((cell) => {
          const dayAssignments = assignmentsByDay.get(cell.iso) ?? [];
          const dayEvents = eventsByDay.get(cell.iso) ?? [];
          const total = dayAssignments.length + dayEvents.length;
          return (
            <div
              key={cell.iso}
              className={`calendar-cell${cell.inMonth ? '' : ' muted-cell'}${cell.isToday ? ' today' : ''}`}
            >
              <div className="calendar-cell-head">
                <span className="calendar-date">{cell.date.getDate()}</span>
                {onAddOnDate && cell.inMonth && (
                  <button
                    className="calendar-add"
                    title="Add an event on this day"
                    onClick={() => onAddOnDate(cell.iso)}
                  >
                    +
                  </button>
                )}
              </div>
              <div className="calendar-items">
                {dayAssignments.slice(0, 2).map((a) => {
                  const cls = classById(a.class_id);
                  const color = cls ? subjectColor(cls.subject) : '#6f655b';
                  return (
                    <button
                      key={a.id}
                      className="calendar-item"
                      style={{ background: `${color}1a`, color, borderColor: `${color}55` }}
                      title={`${a.title}${cls ? ' · ' + cls.name : ''}`}
                      onClick={() => onSelectAssignment?.(a)}
                    >
                      {a.title}
                    </button>
                  );
                })}
                {dayEvents.slice(0, 3).map((e) => {
                  const s = categoryStyle(e.category);
                  return (
                    <button
                      key={e.id}
                      className="calendar-item"
                      style={{ background: `${s.color}1a`, color: s.color, borderColor: `${s.color}55` }}
                      title={`${e.title} (${s.label})`}
                      onClick={() => onSelectEvent?.(e)}
                    >
                      {s.emoji} {e.title}
                    </button>
                  );
                })}
                {total > 5 && <span className="calendar-more">+{total - 5} more</span>}
              </div>
            </div>
          );
        })}
      </div>
      <p className="muted" style={{ fontSize: '0.78rem', marginTop: '0.5rem' }}>
        Subject-colored items are course assignments; the rest are events you added.
        Click the <strong>+</strong> on any day to add one.
      </p>
    </div>
  );
}
