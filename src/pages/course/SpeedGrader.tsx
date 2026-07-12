import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { STATUS_LABELS, submissionStatus } from '../../lib/grades';
import * as repo from '../../lib/repository';
import type { ClassInfo } from '../../lib/types';

/** Canvas SpeedGrader: step through the roster, view work, score + comment. */
export default function SpeedGrader({ cls }: { cls: ClassInfo }) {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { currentUser, assignments, submissions, rosterFor, refresh } = useApp();

  const assignment = assignments.find((a) => a.id === assignmentId);
  const roster = useMemo(() => rosterFor(cls.id), [rosterFor, cls.id]);

  const [index, setIndex] = useState(0);
  const [score, setScore] = useState<string>('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const student = roster[index];
  const sub = useMemo(
    () =>
      student && assignment
        ? submissions.find(
            (s) => s.assignment_id === assignment.id && s.student_id === student.id,
          )
        : undefined,
    [submissions, student, assignment],
  );

  // Load the current grade into the form whenever the student changes.
  useEffect(() => {
    setScore(sub?.score != null ? String(sub.score) : '');
    setComment(sub?.grade_comment ?? '');
    setSavedFlash(false);
  }, [sub, index]);

  if (!assignment || assignment.class_id !== cls.id) {
    return <div className="empty">Assignment not found.</div>;
  }
  if (currentUser?.id !== cls.teacher_id) {
    return <div className="empty">SpeedGrader is for this course's teacher.</div>;
  }
  if (roster.length === 0) {
    return <div className="empty">No students enrolled.</div>;
  }

  const gradedCount = roster.filter((st) =>
    submissions.some(
      (s) => s.assignment_id === assignment.id && s.student_id === st.id && s.graded_at,
    ),
  ).length;

  const status = submissionStatus(assignment, sub);

  const save = async () => {
    if (!student) return;
    setBusy(true);
    try {
      const n = score.trim() === '' ? null : Number(score);
      await repo.gradeSubmission(
        assignment.id,
        student.id,
        Number.isFinite(n as number) ? n : null,
        comment.trim() || null,
      );
      await refresh();
      setSavedFlash(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Link to={`../assignments/${assignment.id}`} className="muted" style={{ fontSize: '0.82rem' }}>
        ← Back to assignment
      </Link>

      <div className="speedgrader-bar">
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>⚡ SpeedGrader — {assignment.title}</h2>
          <p className="sub" style={{ margin: '2px 0 0' }}>
            {gradedCount}/{roster.length} graded · {assignment.points_possible} pts possible
          </p>
        </div>
        <div className="inline" style={{ gap: '0.4rem' }}>
          <button
            className="btn secondary small"
            disabled={index === 0}
            onClick={() => setIndex((i) => i - 1)}
          >
            ← Prev
          </button>
          <select
            className="select"
            value={index}
            onChange={(e) => setIndex(Number(e.target.value))}
          >
            {roster.map((st, i) => (
              <option key={st.id} value={i}>
                {st.name.replace(/ \(Student\)$/, '')}
              </option>
            ))}
          </select>
          <button
            className="btn secondary small"
            disabled={index === roster.length - 1}
            onClick={() => setIndex((i) => i + 1)}
          >
            Next →
          </button>
        </div>
      </div>

      <div className="speedgrader-layout">
        <div className="card submission-viewer">
          <div className="row-between" style={{ marginBottom: '0.6rem' }}>
            <strong>{student?.name.replace(/ \(Student\)$/, '')}</strong>
            <span className={`chip status-${status}`}>{STATUS_LABELS[status]}</span>
          </div>
          {sub?.submitted_at ? (
            <>
              <p className="muted" style={{ fontSize: '0.78rem' }}>
                Submitted{' '}
                {new Date(sub.submitted_at).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
              {sub.body && (
                <div className="submission-body">{sub.body}</div>
              )}
              {sub.url && (
                <p>
                  🔗 <a href={sub.url} target="_blank" rel="noreferrer">{sub.url}</a>
                </p>
              )}
            </>
          ) : (
            <p className="muted">No submission from this student.</p>
          )}
        </div>

        <div className="card grading-panel">
          <div className="field">
            <label>
              Score <span className="hint">out of {assignment.points_possible}</span>
            </label>
            <input
              type="number"
              min={0}
              max={assignment.points_possible}
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Comment <span className="hint">(optional)</span></label>
            <textarea
              value={comment}
              placeholder="Feedback for the student…"
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <div className="row-between">
            {savedFlash ? <span className="muted" style={{ fontSize: '0.8rem' }}>✓ Saved</span> : <span />}
            <button className="btn small" disabled={busy} onClick={save}>
              {busy ? 'Saving…' : 'Save grade'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
