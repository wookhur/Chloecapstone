import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { dueLabel, today } from '../lib/dates';
import { courseGrade, formatPercent, letterGrade } from '../lib/grades';
import { subjectColor } from '../lib/subjectColor';

export default function Dashboard() {
  const {
    currentUser,
    classById,
    profileById,
    myClassIds,
    assignments,
    submissions,
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

  // To Do: students see unsubmitted work due today or later; teachers see
  // submissions waiting for a grade in their classes.
  const todo = useMemo(() => {
    const mine = new Set(myClassIds);
    if (isTeacher) {
      return submissions
        .filter((s) => s.submitted_at && !s.graded_at)
        .map((s) => ({ sub: s, assignment: assignments.find((a) => a.id === s.assignment_id) }))
        .filter((x) => x.assignment && mine.has(x.assignment.class_id))
        .sort((a, b) => (a.sub.submitted_at ?? '').localeCompare(b.sub.submitted_at ?? ''))
        .slice(0, 8);
    }
    return assignments
      .filter((a) => mine.has(a.class_id) && a.due_date >= today())
      .filter(
        (a) =>
          !submissions.some(
            (s) => s.assignment_id === a.id && s.student_id === currentUser?.id && s.submitted_at,
          ),
      )
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 8)
      .map((a) => ({ assignment: a, sub: null }));
  }, [assignments, submissions, myClassIds, isTeacher, currentUser]);

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
                const classAssignments = assignments.filter((a) => a.class_id === c.id);
                const grade = !isTeacher
                  ? courseGrade(classAssignments, submissions, currentUser.id)
                  : null;
                return (
                  <Link key={c.id} to={`/courses/${c.id}`} className="course-card">
                    <div className="course-card-hero" style={{ background: color }} />
                    <div className="course-card-body">
                      <h3 style={{ color }}>{c.name}</h3>
                      <p className="sub">
                        {c.subject} · {c.period} · Room {c.room ?? '—'}
                      </p>
                      <p className="sub">{teacher?.name}</p>
                      {grade && (
                        <span className="chip grade-chip">
                          {letterGrade(grade.percent)} · {formatPercent(grade.percent)}
                        </span>
                      )}
                    </div>
                    <div className="course-card-icons">
                      <span title="Announcements">📣</span>
                      <span title="Assignments">📝</span>
                      <span title="Discussions">💬</span>
                      <span title="Files">📁</span>
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
          <h2>{isTeacher ? 'To grade' : 'To do'}</h2>
          {todo.length === 0 ? (
            <p className="muted" style={{ fontSize: '0.85rem' }}>
              Nothing here. 🎉
            </p>
          ) : (
            <ul className="todo-list">
              {todo.map(({ assignment, sub }) =>
                assignment ? (
                  <li key={sub ? sub.id : assignment.id}>
                    <Link to={`/courses/${assignment.class_id}/assignments/${assignment.id}`}>
                      <span
                        className="feed-date-dot"
                        style={{
                          background: subjectColor(classById(assignment.class_id)?.subject ?? ''),
                        }}
                      />
                      <span className="todo-title">
                        {isTeacher && sub
                          ? `Grade: ${assignment.title} — ${profileById(sub.student_id)?.name ?? '?'}`
                          : assignment.title}
                      </span>
                      <span className="todo-meta">
                        {assignment.points_possible} pts
                        {!isTeacher && ` · ${dueLabel(assignment.due_date)}`}
                      </span>
                    </Link>
                  </li>
                ) : null,
              )}
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
