import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { dueLabel, today } from '../../lib/dates';
import type { ClassInfo } from '../../lib/types';
import { displayName } from '../../lib/names';

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
        <div className="row-between mb-3">
          <h2 className="section-title">Latest announcements</h2>
          <Link to="../announcements" className="btn ghost small">View all</Link>
        </div>
        {recent.length === 0 ? (
          <p className="muted">No announcements yet.</p>
        ) : (
          <div className="stack gap-2">
            {recent.map((an) => (
              <div key={an.id} className="card">
                <strong>{an.title}</strong>
                <p className="sub post-body caption">{an.body}</p>
                <p className="meta caption">
                  {displayName(profileById(an.author_id))} ·{' '}
                  {new Date(an.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <div className="row-between mb-3">
          <h2 className="section-title">Coming up</h2>
          <Link to="../assignments" className="btn ghost small">All assignments</Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="muted">Nothing due soon.</p>
        ) : (
          <ul className="plain-list">
            {upcoming.map((a) => (
              <li key={a.id} className="list-row">
                <Link to={`../assignments/${a.id}`} className="semibold">{a.title}</Link>
                <span className="muted text-xs">
                  {dueLabel(a.due_date)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {topics.length > 0 && (
        <div className="section">
          <div className="row-between mb-3">
            <h2 className="section-title">Active discussions</h2>
            <Link to="../discussions" className="btn ghost small">All discussions</Link>
          </div>
          <ul className="plain-list">
            {topics.map((t) => (
              <li key={t.id} className="list-row">
                <Link to={`../discussions/${t.id}`} className="semibold">{t.title}</Link>
                <span className="muted text-xs">
                  {displayName(profileById(t.author_id))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
