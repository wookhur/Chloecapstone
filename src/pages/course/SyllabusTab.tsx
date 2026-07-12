import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { parseISO } from '../../lib/dates';
import * as repo from '../../lib/repository';
import type { ClassInfo } from '../../lib/types';

/** Canvas Syllabus: course description + auto-generated course summary table. */
export default function SyllabusTab({ cls }: { cls: ClassInfo }) {
  const { currentUser, assignments, refresh } = useApp();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(cls.syllabus ?? '');
  const [busy, setBusy] = useState(false);

  const isCourseTeacher = currentUser?.id === cls.teacher_id;

  const summary = assignments
    .filter((a) => a.class_id === cls.id)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  const save = async () => {
    setBusy(true);
    try {
      await repo.updateClass(cls.id, { syllabus: draft.trim() || null });
      setEditing(false);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="row-between" style={{ marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Syllabus</h2>
        {isCourseTeacher && !editing && (
          <button className="btn small secondary" onClick={() => { setDraft(cls.syllabus ?? ''); setEditing(true); }}>
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="field">
            <textarea
              value={draft}
              style={{ minHeight: 180 }}
              placeholder="Course policies, grading breakdown, expectations…"
              onChange={(e) => setDraft(e.target.value)}
            />
          </div>
          <div className="row-between">
            <button className="btn small secondary" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn small" disabled={busy} onClick={save}>
              {busy ? 'Saving…' : 'Save syllabus'}
            </button>
          </div>
        </div>
      ) : cls.syllabus ? (
        <div className="card" style={{ marginBottom: '1.5rem', whiteSpace: 'pre-wrap' }}>
          {cls.syllabus}
        </div>
      ) : (
        <div className="empty" style={{ marginBottom: '1.5rem' }}>
          No syllabus posted yet.
        </div>
      )}

      <h3 style={{ fontSize: '1rem', margin: '0 0 0.6rem' }}>Course summary</h3>
      {summary.length === 0 ? (
        <p className="muted">No dated work yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Details</th>
              <th style={{ textAlign: 'right' }}>Points</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((a) => (
              <tr key={a.id}>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {parseISO(a.due_date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td>
                  <Link to={`../assignments/${a.id}`}>{a.title}</Link>{' '}
                  <span className="chip" style={{ textTransform: 'capitalize' }}>{a.type}</span>
                </td>
                <td style={{ textAlign: 'right' }}>{a.points_possible}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
