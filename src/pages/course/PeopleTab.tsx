import { useApp } from '../../context/AppContext';
import type { ClassInfo } from '../../lib/types';

/** Canvas People tab: course roster grouped by role. */
export default function PeopleTab({ cls }: { cls: ClassInfo }) {
  const { profileById, rosterFor } = useApp();
  const teacher = profileById(cls.teacher_id);
  const students = rosterFor(cls.id);

  return (
    <div>
      <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>People</h2>

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
                <span className="avatar">{teacher.name.charAt(0)}</span> {teacher.name}
              </td>
              <td><span className="chip">Teacher</span></td>
              <td>—</td>
            </tr>
          )}
          {students.map((s) => (
            <tr key={s.id}>
              <td>
                <span className="avatar">{s.name.charAt(0)}</span>{' '}
                {s.name.replace(/ \(Student\)$/, '')}
              </td>
              <td><span className="chip">Student</span></td>
              <td>{s.grade ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {students.length === 0 && (
        <p className="muted" style={{ marginTop: '0.75rem' }}>No students enrolled yet.</p>
      )}
    </div>
  );
}
