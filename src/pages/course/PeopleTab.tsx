import { useApp } from '../../context/AppContext';
import type { ClassInfo } from '../../lib/types';
import { displayName, initial } from '../../lib/names';

/** Canvas People tab: course roster grouped by role. */
export default function PeopleTab({ cls }: { cls: ClassInfo }) {
  const { profileById, rosterFor } = useApp();
  const teacher = profileById(cls.teacher_id);
  const students = rosterFor(cls.id);

  return (
    <div>
      <h2 className="section-title">People</h2>

      <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Grade</th>
          </tr>
        </thead>
        <tbody>
          {teacher && (
            <tr>
              <td>
                <span className="avatar">{initial(teacher)}</span> {displayName(teacher)}
              </td>
              <td><span className="chip">Teacher</span></td>
              <td>—</td>
            </tr>
          )}
          {students.map((s) => (
            <tr key={s.id}>
              <td>
                <span className="avatar">{initial(s)}</span>{' '}
                {displayName(s)}
              </td>
              <td><span className="chip">Student</span></td>
              <td>{s.grade ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {students.length === 0 && (
        <p className="meta" style={{ marginTop: '0.75rem' }}>No students enrolled yet.</p>
      )}
    </div>
  );
}
