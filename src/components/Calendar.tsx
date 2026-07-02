import { useState } from 'react';
import {
  MONTH_NAMES,
  WEEKDAY_NAMES,
  monthGrid,
  parseISO,
} from '../lib/dates';
import { subjectColor } from '../lib/subjectColor';
import type { Assignment, ClassInfo } from '../lib/types';

interface Props {
  assignments: Assignment[];
  classById: (id: string) => ClassInfo | undefined;
  onSelectAssignment?: (a: Assignment) => void;
}

/** A month calendar that dots each day with the assignments due on it. */
export default function Calendar({ assignments, classById, onSelectAssignment }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const cells = monthGrid(year, month);

  const byDay = new Map<string, Assignment[]>();
  for (const a of assignments) {
    const list = byDay.get(a.due_date) ?? [];
    list.push(a);
    byDay.set(a.due_date, list);
  }

  const step = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  return (
    <div className="calendar">
      <div className="calendar-head">
        <button className="btn ghost small" onClick={() => step(-1)}>‹ Prev</button>
        <h2>{MONTH_NAMES[month]} {year}</h2>
        <button className="btn ghost small" onClick={() => step(1)}>Next ›</button>
      </div>

      <div className="calendar-grid">
        {WEEKDAY_NAMES.map((w) => (
          <div className="calendar-weekday" key={w}>{w}</div>
        ))}
        {cells.map((cell) => {
          const items = byDay.get(cell.iso) ?? [];
          return (
            <div
              key={cell.iso}
              className={`calendar-cell${cell.inMonth ? '' : ' muted-cell'}${cell.isToday ? ' today' : ''}`}
            >
              <span className="calendar-date">{cell.date.getDate()}</span>
              <div className="calendar-items">
                {items.slice(0, 3).map((a) => {
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
                {items.length > 3 && (
                  <span className="calendar-more">+{items.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="muted" style={{ fontSize: '0.78rem', marginTop: '0.5rem' }}>
        Showing assignments due, colored by subject.
        {' '}Today is {MONTH_NAMES[today.getMonth()].slice(0, 3)} {today.getDate()},{' '}
        {parseISO(new Date().toISOString().slice(0, 10)).getFullYear()}.
      </p>
    </div>
  );
}
