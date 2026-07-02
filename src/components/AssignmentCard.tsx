import { dueLabel } from '../lib/dates';
import { subjectColor } from '../lib/subjectColor';
import type { Assignment, ClassInfo } from '../lib/types';

const TYPE_EMOJI: Record<Assignment['type'], string> = {
  homework: '📝',
  quiz: '❓',
  test: '📄',
  project: '📦',
};

interface Props {
  assignment: Assignment;
  cls?: ClassInfo;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function AssignmentCard({ assignment, cls, onEdit, onDelete }: Props) {
  const color = cls ? subjectColor(cls.subject) : '#6f655b';
  const overdue = dueLabel(assignment.due_date).startsWith('Overdue');

  return (
    <div className="card assignment" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="row-between">
        <div>
          <div className="inline" style={{ gap: '0.4rem' }}>
            <span>{TYPE_EMOJI[assignment.type]}</span>
            <h3 style={{ margin: 0 }}>{assignment.title}</h3>
          </div>
          <p className="sub" style={{ marginTop: 2 }}>
            {cls ? (
              <span className="chip" style={{ background: `${color}1a`, color, borderColor: `${color}55` }}>
                {cls.name}
              </span>
            ) : null}{' '}
            <span className="muted" style={{ textTransform: 'capitalize' }}>{assignment.type}</span>
          </p>
        </div>
        <span className={`due ${overdue ? 'overdue' : ''}`}>{dueLabel(assignment.due_date)}</span>
      </div>

      {assignment.description && (
        <p className="sub" style={{ marginTop: '0.6rem' }}>{assignment.description}</p>
      )}

      {(assignment.link || onEdit || onDelete) && (
        <div className="row-between" style={{ marginTop: '0.7rem' }}>
          {assignment.link ? (
            <a href={assignment.link} target="_blank" rel="noreferrer" className="btn ghost small">
              🔗 Resource
            </a>
          ) : (
            <span />
          )}
          {(onEdit || onDelete) && (
            <div className="inline" style={{ gap: '0.4rem' }}>
              {onEdit && (
                <button className="btn secondary small" onClick={onEdit}>Edit</button>
              )}
              {onDelete && (
                <button className="btn danger small" onClick={onDelete}>Delete</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
