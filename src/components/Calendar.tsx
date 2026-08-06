import { useState } from 'react';
import {
  MONTH_NAMES,
  WEEKDAY_NAMES,
  monthGrid,
  parseISO,
} from '../lib/dates';
import { accent, subjectColor } from '../lib/subjectColor';
import {
  CALENDAR_CATEGORIES,
  type Assignment,
  type CalendarEvent,
  type ClassInfo,
} from '../lib/types';
import Icon, { type IconName } from './Icon';

interface Props {
  assignments: Assignment[];
  events: CalendarEvent[];
  classById: (id: string) => ClassInfo | undefined;
  onSelectAssignment?: (a: Assignment) => void;
  onSelectEvent?: (e: CalendarEvent) => void;
  /** Called when a day cell's "+" is clicked, to add an event on that date. */
  onAddOnDate?: (iso: string) => void;
}

/** How many of each kind a day cell shows before collapsing behind "+N more". */
const MAX_ASSIGNMENTS = 2;
const MAX_EVENTS = 3;

const categoryStyle = (cat: CalendarEvent['category']) =>
  CALENDAR_CATEGORIES.find((c) => c.key === cat) ?? CALENDAR_CATEGORIES[0];

const longDate = (iso: string) =>
  parseISO(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

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
  /** Day whose full item list is expanded (set by clicking "+N more"). */
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

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
    setExpandedDay(null);
  };

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setExpandedDay(null);
  };

  return (
    <div className="calendar">
      <div className="calendar-head">
        <button className="btn ghost small" onClick={() => step(-1)}>‹ Prev</button>
        <div className="inline gap-2">
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
          const expanded = expandedDay === cell.iso;
          // Each list has its own cap, so count what is actually rendered.
          const shownAssignments = expanded
            ? dayAssignments
            : dayAssignments.slice(0, MAX_ASSIGNMENTS);
          const shownEvents = expanded ? dayEvents : dayEvents.slice(0, MAX_EVENTS);
          const hidden =
            dayAssignments.length +
            dayEvents.length -
            shownAssignments.length -
            shownEvents.length;

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
                    title={`Add an event on ${longDate(cell.iso)}`}
                    aria-label={`Add an event on ${longDate(cell.iso)}`}
                    onClick={() => onAddOnDate(cell.iso)}
                  >
                    +
                  </button>
                )}
              </div>
              <div className="calendar-items">
                {shownAssignments.map((a) => {
                  const cls = classById(a.class_id);
                  const color = cls ? subjectColor(cls.subject) : '#6f655b';
                  return (
                    <button
                      key={a.id}
                      // Assignments read as solid chips; personal events are outlined.
                      className="calendar-item is-assignment"
                      style={accent(color)}
                      title={`Assignment · ${a.title}${cls ? ' · ' + cls.name : ''}`}
                      onClick={() => onSelectAssignment?.(a)}
                    >
                      <span className="calendar-item-dot" style={{ background: color }} />
                      <span className="calendar-item-label">{a.title}</span>
                    </button>
                  );
                })}
                {shownEvents.map((e) => {
                  const s = categoryStyle(e.category);
                  return (
                    <button
                      key={e.id}
                      className="calendar-item is-event"
                      style={accent(s.color)}
                      title={`${s.label} · ${e.title}`}
                      onClick={() => onSelectEvent?.(e)}
                    >
                      <Icon name={s.icon as IconName} size="0.85em" />
                      <span className="calendar-item-label">{e.title}</span>
                    </button>
                  );
                })}
                {hidden > 0 && (
                  <button
                    className="calendar-more"
                    aria-label={`Show ${hidden} more item${hidden === 1 ? '' : 's'} on ${longDate(cell.iso)}`}
                    onClick={() => setExpandedDay(cell.iso)}
                  >
                    +{hidden} more
                  </button>
                )}
                {expanded && (
                  <button
                    className="calendar-more"
                    aria-label={`Collapse ${longDate(cell.iso)}`}
                    onClick={() => setExpandedDay(null)}
                  >
                    Show less
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="meta calendar-caption">
        Solid chips with a dot are course assignments; outlined chips with an icon are
        events you added. Use the <strong>+</strong> on any day to add one.
      </p>
    </div>
  );
}
