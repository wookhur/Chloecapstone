import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { dueLabel, today } from '../lib/dates';
import { subjectColor } from '../lib/subjectColor';

export default function Dashboard() {
  const {
    currentUser,
    classById,
    profileById,
    myClassIds,
    assignments,
    announcements,
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
  const todo = useMemo(() => {
    const mine = new Set(myClassIds);
    return assignments
      .filter((a) => mine.has(a.class_id) && a.due_date >= today())
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 8);
  }, [assignments, myClassIds]);

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
        <p>Welcome back, {currentUser.name.replace(/ \(Student\)$/, '')}.</p>
      </div>

      <div className="dashboard-layout">
        <div>
          {myClasses.length === 0 ? (
            <div className="empty">
              {isTeacher ? (
                <>
                  You don't teach any classes yet.{' '}
                  <Link to="/courses/manage">Create one →</Link>
                </>
              ) : (
                <>
                  You aren't enrolled in any courses yet.{' '}
                  <Link to="/courses/browse">Browse the catalog →</Link>
                </>
              )}
            </div>
          ) : (
            <div className="course-card-grid">
              {myClasses.map((c) => {
                const color = subjectColor(c.subject);
                const teacher = profileById(c.teacher_id);
                return (
                  <Link key={c.id} to={`/courses/${c.id}`} className="course-card">
                    <div className="course-card-hero" style={{ background: color }} />
                    <div className="course-card-body">
                      <h3 style={{ color }}>{c.name}</h3>
                      <p className="sub">
                        {c.subject} · {c.period} · Room {c.room ?? '—'}
                      </p>
                      <p className="sub">{teacher?.name}</p>
                    </div>
                    <div className="course-card-icons">
                      <span title="Announcements">📣</span>
                      <span title="Assignments">📝</span>
                      <span title="Discussions">💬</span>
                      <span title="Practice quizzes">📚</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {recentAnnouncements.length > 0 && (
            <div className="section" style={{ marginTop: '1.5rem' }}>
              <h2>Recent announcements</h2>
              <div className="stack" style={{ gap: '0.6rem' }}>
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
                          <p className="sub" style={{ margin: '2px 0 0' }}>
                            {cls?.name} · {profileById(an.author_id)?.name}
                          </p>
                        </div>
                        <span className="muted" style={{ fontSize: '0.78rem' }}>
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
            <p className="muted" style={{ fontSize: '0.85rem' }}>
              Nothing due soon. 🎉
            </p>
          ) : (
            <ul className="todo-list">
              {todo.map((a) => (
                <li key={a.id}>
                  <Link to={`/courses/${a.class_id}/assignments/${a.id}`}>
                    <span
                      className="feed-date-dot"
                      style={{ background: subjectColor(classById(a.class_id)?.subject ?? '') }}
                    />
                    <span className="todo-title">{a.title}</span>
                    <span className="todo-meta">{dueLabel(a.due_date)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="divider" />
          <Link to="/homework" className="btn ghost small">
            View all upcoming work →
          </Link>
        </aside>
      </div>
    </div>
  );
}
