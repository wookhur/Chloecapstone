import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { subjectColor } from '../lib/subjectColor';
import { displayName } from '../lib/names';
import { SCHOOL_YEAR } from '../lib/types';
import Icon from '../components/Icon';

/** Canvas "All Courses" — the flat list of everything you're enrolled in / teach. */
export default function CoursesPage() {
  const { currentUser, classById, profileById, myClassIds, rosterFor } = useApp();

  if (!currentUser) return <div className="empty">Select a user to begin.</div>;
  const isTeacher = currentUser.role === 'teacher';

  const myClasses = myClassIds
    .map((id) => classById(id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <div className="page-head">
        <h1>Courses</h1>
        <p>{SCHOOL_YEAR} school year.</p>
      </div>

      <div className="toolbar">
        <span className="muted">
          {myClasses.length} course{myClasses.length === 1 ? '' : 's'}
        </span>
        <div className="inline" style={{ gap: '0.4rem' }}>
          <Link to="/courses/import" className="btn small secondary">
            <Icon name="download" /> Import from Google Classroom
          </Link>
          {isTeacher ? (
            <Link to="/courses/manage" className="btn small">
              Manage classes & homework
            </Link>
          ) : (
            <Link to="/courses/browse" className="btn small">
              + Browse all courses
            </Link>
          )}
        </div>
      </div>

      {myClasses.length === 0 ? (
        <div className="empty">
          {isTeacher
            ? 'You don\'t teach any classes yet.'
            : 'You aren\'t enrolled in any courses yet.'}{' '}
          <Link to="/courses/import">Import from Google Classroom →</Link>
        </div>
      ) : (
        <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Subject</th>
              <th>Teacher</th>
              <th>Period</th>
              <th>Room</th>
              <th>Students</th>
            </tr>
          </thead>
          <tbody>
            {myClasses.map((c) => {
              const color = subjectColor(c.subject);
              return (
                <tr key={c.id}>
                  <td>
                    <Link to={`/courses/${c.id}`} style={{ fontWeight: 600 }}>
                      <span className="feed-date-dot" style={{ background: color, display: 'inline-block', marginRight: 8 }} />
                      {c.name}
                    </Link>
                  </td>
                  <td>{c.subject}</td>
                  <td>{displayName(profileById(c.teacher_id))}</td>
                  <td>{c.period}</td>
                  <td>{c.room ?? '—'}</td>
                  <td>{rosterFor(c.id).length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
