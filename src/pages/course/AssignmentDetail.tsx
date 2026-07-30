import { Link, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { dueLabel, parseISO } from '../../lib/dates';
import type { Assignment, ClassInfo } from '../../lib/types';

const TYPE_EMOJI: Record<Assignment['type'], string> = {
  homework: '📝',
  quiz: '❓',
  test: '📄',
  project: '📦',
};

/** Read-only assignment detail — this site tracks homework, it isn't a submission portal. */
export default function AssignmentDetail({ cls }: { cls: ClassInfo }) {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { assignments } = useApp();

  const assignment = assignments.find((a) => a.id === assignmentId);
  if (!assignment || assignment.class_id !== cls.id) {
    return <div className="empty">Assignment not found.</div>;
  }

  const overdue = dueLabel(assignment.due_date).startsWith('Overdue');

  return (
    <div>
      <Link to="../assignments" className="meta">
        ← All assignments
      </Link>
      <h2 style={{ margin: '0.5rem 0 0.25rem' }}>
        {TYPE_EMOJI[assignment.type]} {assignment.title}
      </h2>
      <p className="sub">
        <span className="chip" style={{ textTransform: 'capitalize' }}>{assignment.type}</span>{' '}
        <span className={overdue ? 'due overdue' : 'due'}>
          Due {parseISO(assignment.due_date).toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}{' '}
          ({dueLabel(assignment.due_date)})
        </span>
      </p>

      {assignment.description ? (
        <div className="card subtle" style={{ margin: '1rem 0', whiteSpace: 'pre-wrap' }}>
          {assignment.description}
        </div>
      ) : (
        <p className="muted" style={{ margin: '1rem 0' }}>No further details.</p>
      )}

      {assignment.link && (
        <p>
          <a href={assignment.link} target="_blank" rel="noreferrer" className="btn ghost small">
            🔗 Resource
          </a>
        </p>
      )}
    </div>
  );
}
