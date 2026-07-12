import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { dueLabel, today } from '../../lib/dates';
import type { ClassInfo } from '../../lib/types';

/** Course front page: recent activity stream, Canvas-style. */
export default function CourseHome({ cls }: { cls: ClassInfo }) {
  const { announcements, assignments, discussionTopics, profileById } = useApp();

  const recent = announcements
    .filter((a) => a.class_id === cls.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 3);

  const upcoming = assignments
    .filter((a) => a.class_id === cls.id && a.due_date >= today())
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 5);

  const topics = discussionTopics
    .filter((t) => t.class_id === cls.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 3);

  return (
    <div>
      <div className="section">
        <div className="row-between" style={{ marginBottom: '0.6rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>📣 Latest announcements</h2>
          <Link to="../announcements" className="btn ghost small">View all</Link>
        </div>
        {recent.length === 0 ? (
          <p className="muted">No announcements yet.</p>
        ) : (
          <div className="stack" style={{ gap: '0.6rem' }}>
            {recent.map((an) => (
              <div key={an.id} className="card subtle">
                <strong>{an.title}</strong>
                <p className="sub" style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{an.body}</p>
                <p className="muted" style={{ fontSize: '0.75rem', margin: '6px 0 0' }}>
                  {profileById(an.author_id)?.name} ·{' '}
                  {new Date(an.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <div className="row-between" style={{ marginBottom: '0.6rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>📝 Coming up</h2>
          <Link to="../assignments" className="btn ghost small">All assignments</Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="muted">Nothing due soon.</p>
        ) : (
          <ul className="plain-list">
            {upcoming.map((a) => (
              <li key={a.id} className="list-row">
                <Link to={`../assignments/${a.id}`} style={{ fontWeight: 600 }}>{a.title}</Link>
                <span className="muted" style={{ fontSize: '0.8rem' }}>
                  {dueLabel(a.due_date)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {topics.length > 0 && (
        <div className="section">
          <div className="row-between" style={{ marginBottom: '0.6rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>💬 Active discussions</h2>
            <Link to="../discussions" className="btn ghost small">All discussions</Link>
          </div>
          <ul className="plain-list">
            {topics.map((t) => (
              <li key={t.id} className="list-row">
                <Link to={`../discussions/${t.id}`} style={{ fontWeight: 600 }}>{t.title}</Link>
                <span className="muted" style={{ fontSize: '0.8rem' }}>
                  {profileById(t.author_id)?.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
