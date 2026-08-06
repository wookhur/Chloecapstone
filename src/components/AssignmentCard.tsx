import { dueLabel } from '../lib/dates';
import { useApp } from '../context/AppContext';
import DoneCheckbox from './DoneCheckbox';
import { accent, subjectColor } from '../lib/subjectColor';
import type { Assignment, ClassInfo } from '../lib/types';
import Icon, { ASSIGNMENT_ICON } from './Icon';

interface Props {
  assignment: Assignment;
  cls?: ClassInfo;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function AssignmentCard({ assignment, cls, onEdit, onDelete }: Props) {
  const { isDone } = useApp();
  const color = cls ? subjectColor(cls.subject) : '#6f655b';
  const done = isDone(assignment.id);
  // Once ticked, overdue is no longer news — stop shouting about it.
  const overdue = !done && dueLabel(assignment.due_date).startsWith('Overdue');

  return (
    <div className={`card assignment accent-left ${done ? 'is-done' : ''}`} style={accent(color)}>
      <div className="row-between">
        <div>
          <div className="inline gap-1">
            <DoneCheckbox assignment={assignment} />
            <Icon name={ASSIGNMENT_ICON[assignment.type]} />
            <h3 className="m-0">{assignment.title}</h3>
          </div>
          <p className="sub mt-1">
            {cls ? (
              <span className="subject-chip">
                <span className="legend-dot" style={{ background: color }} />
                {cls.name}
              </span>
            ) : null}{' '}
            <span className="muted capitalize">{assignment.type}</span>
          </p>
        </div>
        <span className={`due ${overdue ? 'overdue' : ''}`}>{dueLabel(assignment.due_date)}</span>
      </div>

      {assignment.description && (
        <p className="sub mt-3">{assignment.description}</p>
      )}

      {(assignment.link || onEdit || onDelete) && (
        <div className="row-between mt-3">
          {assignment.link ? (
            <a href={assignment.link} target="_blank" rel="noreferrer" className="btn ghost small">
              <Icon name="link" /> Resource
            </a>
          ) : (
            <span />
          )}
          {(onEdit || onDelete) && (
            <div className="inline gap-1">
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
