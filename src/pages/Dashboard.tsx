import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { dueLabel, today } from '../lib/dates';
import { subjectColor } from '../lib/subjectColor';
import DueSoon from '../components/DueSoon';
import RequestMeeting from '../components/RequestMeeting';
import WeeklyDigest from '../components/WeeklyDigest';
import { displayName } from '../lib/names';
import Icon from '../components/Icon';

export default function Dashboard() {
  const {
    currentUser,
    classById,
    profileById,
    myClassIds,
    assignments,
    announcements,
    isDone,
  } = useApp();

  const isTeacher = currentUser?.role === 'teacher';

  const myClasses = useMemo(
    () =>
      myClassIds
        .map((id) => classById(id))
        .filter((c): c is NonNullable<typeof c> => Boolean(c))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [myClassIds, classById],
  );

  // To Do: upcoming assignments across the courses you're in / teach.
  // "Coming up" is a to-do list, so anything already ticked drops off it.
  const todo = useMemo(() => {
    const mine = new Set(myClassIds);
    return assignments
      .filter((a) => mine.has(a.class_id) && a.due_date >= today())
      .filter((a) => !isDone(a.id))
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 8);
  }, [assignments, myClassIds, isDone]);

  const recentAnnouncements = useMemo(() => {
    const mine = new Set(myClassIds);
    return announcements
      .filter((a) => mine.has(a.class_id))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 4);
  }, [announcements, myClassIds]);

  if (!currentUser) return <div className="empty">Select a user to begin.</div>;

  return (
    <div>
      <div className="page-head">
        <h1>Dashboard</h1>
        <p>Welcome back, {displayName(currentUser)}.</p>
      </div>

      <DueSoon />

      <div className="dashboard-layout">
        <div>
          {myClasses.length === 0 ? (
            <div className="empty">
              {isTeacher ? (
                <>
                  You don't teach any classes yet.{' '}
                  <Link to="/courses/manage">Create one <Icon name="arrow-right" size="0.9em" /></Link>
                </>
              ) : (
                <>
                  You aren't enrolled in any courses yet.{' '}
                  <Link to="/courses/browse">Browse the catalog <Icon name="arrow-right" size="0.9em" /></Link>
                </>
              )}
            </div>
          ) : (
            <div className="course-card-grid">
              {myClasses.map((c) => {
                const color = subjectColor(c.subject);
                const teacher = profileById(c.teacher_id);
                const openCount = assignments.filter(
                  (a) => a.class_id === c.id && a.due_date >= today() && !isDone(a.id),
                ).length;
                return (
                  <Link key={c.id} to={`/courses/${c.id}`} className="course-card">
                    <div className="course-card-body">
                      <p className="eyebrow">
                        <span className="dot-sm" style={{ background: color }} />
                        {c.subject}
                      </p>
                      <h3>{c.name}</h3>
                      <p className="sub">
                        {c.period} · Room {c.room ?? '—'}
                      </p>
                      <p className="sub">{displayName(teacher)}</p>
                    </div>
                    {/* Counts, not a row of identical icons. Four bare glyphs
                        repeated on every card told a student nothing they
                        couldn't already see. */}
                    <p className="course-card-stat">
                      {openCount === 0
                        ? 'Nothing due'
                        : `${openCount} due`}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}

          {recentAnnouncements.length > 0 && (
            <div className="section mt-5">
              <h2>Recent announcements</h2>
              <div className="stack gap-2">
                {recentAnnouncements.map((an) => {
                  const cls = classById(an.class_id);
                  return (
                    <Link
                      key={an.id}
                      to={`/courses/${an.class_id}/announcements`}
                      className="card announcement-row"
                    >
                      <div className="row-between">
                        <div>
                          <strong>{an.title}</strong>
                          <p className="sub caption">
                            {cls?.name} · {displayName(profileById(an.author_id))}
                          </p>
                        </div>
                        <span className="meta">
                          {new Date(an.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <aside className="todo-panel">
          <h2>Coming up</h2>
          {todo.length === 0 ? (
            <p className="meta">
              Nothing due soon.
            </p>
          ) : (
            <ul className="todo-list">
              {todo.map((a) => (
                <li key={a.id}>
                  <Link to={`/courses/${a.class_id}/assignments/${a.id}`}>
                    <span className="todo-title">{a.title}</span>
                    <span className="todo-meta">
                      {classById(a.class_id)?.name} · {dueLabel(a.due_date)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="divider" />
          <Link to="/homework" className="btn ghost small">
            View all upcoming work <Icon name="arrow-right" size="0.9em" />
          </Link>
        </aside>
      </div>

      <RequestMeeting />

      <WeeklyDigest />
    </div>
  );
}
