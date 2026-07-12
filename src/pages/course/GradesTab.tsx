import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  STATUS_LABELS,
  courseGrade,
  formatPercent,
  letterGrade,
  submissionStatus,
} from '../../lib/grades';
import * as repo from '../../lib/repository';
import type { Assignment, ClassInfo, Profile } from '../../lib/types';

/** Students see their own grades; the course teacher sees the full Gradebook grid. */
export default function GradesTab({ cls }: { cls: ClassInfo }) {
  const { currentUser } = useApp();
  if (!currentUser) return null;
  return currentUser.id === cls.teacher_id ? (
    <TeacherGradebook cls={cls} />
  ) : (
    <StudentGrades cls={cls} student={currentUser} />
  );
}

function StudentGrades({ cls, student }: { cls: ClassInfo; student: Profile }) {
  const { assignments, submissions } = useApp();

  const list = useMemo(
    () =>
      assignments
        .filter((a) => a.class_id === cls.id)
        .sort((a, b) => a.due_date.localeCompare(b.due_date)),
    [assignments, cls.id],
  );

  const total = courseGrade(list, submissions, student.id);

  return (
    <div>
      <div className="row-between" style={{ marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Grades</h2>
        {total ? (
          <div className="total-grade">
            <strong>{letterGrade(total.percent)}</strong> {formatPercent(total.percent)}{' '}
            <span className="muted">
              ({total.earned}/{total.possible} pts)
            </span>
          </div>
        ) : (
          <span className="muted">Nothing graded yet</span>
        )}
      </div>

      {list.length === 0 ? (
        <div className="empty">No assignments yet.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Assignment</th>
              <th>Due</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {list.map((a) => {
              const sub = submissions.find(
                (s) => s.assignment_id === a.id && s.student_id === student.id,
              );
              const status = submissionStatus(a, sub);
              return (
                <tr key={a.id}>
                  <td>
                    <Link to={`../assignments/${a.id}`}>{a.title}</Link>
                    {sub?.grade_comment && (
                      <div className="muted" style={{ fontSize: '0.76rem', marginTop: 2 }}>
                        💬 {sub.grade_comment}
                      </div>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{a.due_date}</td>
                  <td>
                    <span className={`chip status-${status}`}>{STATUS_LABELS[status]}</span>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {sub?.graded_at && sub.score != null ? (
                      <strong>
                        {sub.score}/{a.points_possible}
                      </strong>
                    ) : (
                      <span className="muted">—/{a.points_possible}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function TeacherGradebook({ cls }: { cls: ClassInfo }) {
  const { assignments, submissions, rosterFor, refresh } = useApp();
  const [editing, setEditing] = useState<{ aId: string; sId: string } | null>(null);
  const [draft, setDraft] = useState('');

  const roster = rosterFor(cls.id);
  const list = useMemo(
    () =>
      assignments
        .filter((a) => a.class_id === cls.id)
        .sort((a, b) => a.due_date.localeCompare(b.due_date)),
    [assignments, cls.id],
  );

  const subFor = (a: Assignment, studentId: string) =>
    submissions.find((s) => s.assignment_id === a.id && s.student_id === studentId);

  const commit = async () => {
    if (!editing) return;
    const n = draft.trim() === '' ? null : Number(draft);
    const existing = subFor(
      list.find((a) => a.id === editing.aId)!,
      editing.sId,
    );
    await repo.gradeSubmission(
      editing.aId,
      editing.sId,
      Number.isFinite(n as number) ? n : null,
      existing?.grade_comment ?? null,
    );
    setEditing(null);
    await refresh();
  };

  if (roster.length === 0) return <div className="empty">No students enrolled yet.</div>;

  return (
    <div>
      <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem' }}>Gradebook</h2>
      <p className="sub" style={{ marginBottom: '1rem' }}>
        Click a cell to enter a score. Blank clears the grade.
      </p>

      <div className="gradebook-scroll">
        <table className="data-table gradebook">
          <thead>
            <tr>
              <th className="sticky-col">Student</th>
              {list.map((a) => (
                <th key={a.id} title={a.title}>
                  <Link to={`../assignments/${a.id}/speedgrader`}>{a.title}</Link>
                  <div className="muted" style={{ fontWeight: 400 }}>{a.points_possible} pts</div>
                </th>
              ))}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((st) => {
              const total = courseGrade(list, submissions, st.id);
              return (
                <tr key={st.id}>
                  <td className="sticky-col">
                    <strong>{st.name.replace(/ \(Student\)$/, '')}</strong>
                  </td>
                  {list.map((a) => {
                    const sub = subFor(a, st.id);
                    const isEditing = editing?.aId === a.id && editing?.sId === st.id;
                    const status = submissionStatus(a, sub);
                    return (
                      <td
                        key={a.id}
                        className={`grade-cell status-bg-${status}`}
                        onClick={() => {
                          if (!isEditing) {
                            setEditing({ aId: a.id, sId: st.id });
                            setDraft(sub?.score != null ? String(sub.score) : '');
                          }
                        }}
                      >
                        {isEditing ? (
                          <input
                            autoFocus
                            className="grade-input"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onBlur={commit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commit();
                              if (e.key === 'Escape') setEditing(null);
                            }}
                          />
                        ) : sub?.score != null ? (
                          sub.score
                        ) : sub?.submitted_at ? (
                          '📩'
                        ) : (
                          '—'
                        )}
                      </td>
                    );
                  })}
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {total ? (
                      <strong>
                        {letterGrade(total.percent)} {formatPercent(total.percent)}
                      </strong>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ fontSize: '0.76rem', marginTop: '0.5rem' }}>
        📩 = submitted, not graded yet · — = no submission
      </p>
    </div>
  );
}
