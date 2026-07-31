import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { dueLabel, parseISO, today } from '../lib/dates';
import { displayName } from '../lib/names';
import { subjectColor } from '../lib/subjectColor';
import { dueSoon } from '../lib/reminders';
import { CALENDAR_CATEGORIES } from '../lib/types';
import Icon, { type IconName } from '../components/Icon';

/**
 * A guardian's read-only view of their student: what's coming up and any
 * counseling meetings that have been booked.
 *
 * Deliberately read-only. A parent seeing the workload is useful; a parent
 * ticking work off, posting to a class, or reading discussions is not — that
 * would take the app away from the student it belongs to.
 */
export default function Family() {
  const {
    currentUser,
    myStudents,
    assignments,
    enrollments,
    completions,
    calendarEvents,
    classById,
  } = useApp();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const student = myStudents.find((s) => s.id === selectedId) ?? myStudents[0] ?? null;

  const classIds = useMemo(() => {
    if (!student) return new Set<string>();
    return new Set(
      enrollments.filter((e) => e.student_id === student.id).map((e) => e.class_id),
    );
  }, [enrollments, student]);

  const upcoming = useMemo(() => {
    if (!student) return [];
    const done = new Set(
      completions.filter((c) => c.student_id === student.id).map((c) => c.assignment_id),
    );
    return assignments
      .filter((a) => classIds.has(a.class_id) && a.due_date >= today())
      .map((a) => ({ ...a, done: done.has(a.id) }))
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 12);
  }, [assignments, classIds, completions, student]);

  const urgent = useMemo(
    () => dueSoon(assignments.filter((a) => classIds.has(a.class_id))),
    [assignments, classIds],
  );

  const meetings = useMemo(() => {
    if (!student) return [];
    return calendarEvents
      .filter((e) => e.owner_id === student.id && e.category === 'counseling')
      .filter((e) => e.date >= today())
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [calendarEvents, student]);

  if (currentUser?.role !== 'parent') {
    return <div className="empty">This page is for parent and guardian accounts.</div>;
  }

  if (!student) {
    return (
      <div>
        <div className="page-head"><h1>Family</h1></div>
        <div className="empty">
          This account isn't linked to a student yet. The school office can connect it.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <h1>{displayName(student)}</h1>
        <p>
          What's coming up in {displayName(student)}'s classes. This view is read-only —
          the checklist stays theirs.
        </p>
      </div>

      {myStudents.length > 1 && (
        <div className="cal-legend">
          {myStudents.map((s) => (
            <button
              key={s.id}
              className={`legend-chip ${s.id === student.id ? 'on' : ''}`}
              onClick={() => setSelectedId(s.id)}
            >
              {displayName(s)}
            </button>
          ))}
        </div>
      )}

      {urgent.length > 0 && (
        <div className="callout">
          <span className="callout-icon"><Icon name="clock" /></span>
          <div>
            <strong>
              {urgent.length} thing{urgent.length === 1 ? '' : 's'} due in the next couple of days
            </strong>
            <p style={{ margin: '4px 0 0' }}>
              {urgent.slice(0, 3).map((a) => a.title).join(' · ')}
            </p>
          </div>
        </div>
      )}

      <div className="section">
        <h2 className="section-title">Coming up</h2>
        {upcoming.length === 0 ? (
          <div className="empty">Nothing due right now.</div>
        ) : (
          <ul className="plain-list boxed">
            {upcoming.map((a) => {
              const cls = classById(a.class_id);
              return (
                <li key={a.id} className={`list-row ${a.done ? 'is-done' : ''}`}>
                  <div className="inline" style={{ gap: '0.5rem' }}>
                    <span
                      className="feed-date-dot"
                      style={{ background: subjectColor(cls?.subject ?? '') }}
                    />
                    <div>
                      <strong>{a.title}</strong>
                      <div className="meta">{cls?.name}</div>
                    </div>
                  </div>
                  <span className="inline" style={{ gap: '0.5rem' }}>
                    {a.done && <span className="chip request-accepted">Done</span>}
                    <span className="due">{dueLabel(a.due_date)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {meetings.length > 0 && (
        <div className="section">
          <h2 className="section-title">Counseling meetings</h2>
          <ul className="plain-list boxed">
            {meetings.map((m) => {
              const cat = CALENDAR_CATEGORIES.find((c) => c.key === m.category);
              return (
                <li key={m.id} className="list-row">
                  <div>
                    <strong className="inline">
                      {cat && <Icon name={cat.icon as IconName} />}
                      {m.title}
                    </strong>
                    {m.note && <div className="meta">{m.note}</div>}
                  </div>
                  <span className="due">
                    {parseISO(m.date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="meta">
        Showing {displayName(student)}'s posted due dates. Grades live in the school's
        own system, not here.
      </p>
    </div>
  );
}
