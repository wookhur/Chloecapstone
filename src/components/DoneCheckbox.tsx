import { useApp } from '../context/AppContext';
import type { Assignment } from '../lib/types';

/**
 * A student's private tick — the digital version of crossing a line out of a
 * paper planner. Only students see it, and it never reaches a teacher or a
 * grade; this app deliberately leaves grading to the school's own system.
 */
export default function DoneCheckbox({
  assignment,
  label,
}: {
  assignment: Assignment;
  /** Show the word "Done" next to the box (list rows), or icon only (compact). */
  label?: boolean;
}) {
  const { currentUser, isDone, toggleDone } = useApp();
  if (currentUser?.role !== 'student') return null;

  const done = isDone(assignment.id);

  return (
    <label className={`done-check ${done ? 'is-done' : ''}`} title={`Mark "${assignment.title}" as done`}>
      <input
        type="checkbox"
        checked={done}
        aria-label={`Mark "${assignment.title}" as done`}
        onChange={() => void toggleDone(assignment.id)}
      />
      {label && <span>{done ? 'Done' : 'Mark done'}</span>}
    </label>
  );
}
