import { Link, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import DoneCheckbox from '../../components/DoneCheckbox';
import { dueLabel, parseISO } from '../../lib/dates';
import type { ClassInfo } from '../../lib/types';
import Icon, { ASSIGNMENT_ICON } from '../../components/Icon';

/** Read-only assignment detail — this site tracks homework, it isn't a submission portal. */
export default function AssignmentDetail({ cls }: { cls: ClassInfo }) {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { assignments, isDone } = useApp();

  const assignment = assignments.find((a) => a.id === assignmentId);
  if (!assignment || assignment.class_id !== cls.id) {
    return <div className="empty">Assignment not found.</div>;
  }

  // A ticked-off assignment no longer needs an overdue warning.
  const overdue = !isDone(assignment.id) && dueLabel(assignment.due_date).startsWith('Overdue');

  return (
    <div>
      <Link to="../assignments" className="meta">
        <Icon name="chevron-left" size="0.9em" /> All assignments
      </Link>
      <h2 className="detail-head">
        <Icon name={ASSIGNMENT_ICON[assignment.type]} /> {assignment.title}
      </h2>
      <p className="sub inline">
        <DoneCheckbox assignment={assignment} label />
        <span className="chip capitalize">{assignment.type}</span>{' '}
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
        <div className="card subtle post-body my-4">
          {assignment.description}
        </div>
      ) : (
        <p className="muted my-4">No further details.</p>
      )}

      {assignment.link && (
        <p>
          <a href={assignment.link} target="_blank" rel="noreferrer" className="btn ghost small">
            <Icon name="link" /> Resource
          </a>
        </p>
      )}
    </div>
  );
}
