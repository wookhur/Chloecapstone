import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { dueLabel, parseISO } from '../../lib/dates';
import { STATUS_LABELS, submissionStatus } from '../../lib/grades';
import * as repo from '../../lib/repository';
import type { ClassInfo } from '../../lib/types';

export default function AssignmentDetail({ cls }: { cls: ClassInfo }) {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const {
    currentUser,
    assignments,
    submissions,
    quizQuestions,
    mySubmission,
    rosterFor,
    refresh,
  } = useApp();

  const assignment = assignments.find((a) => a.id === assignmentId);
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);

  const sub = assignment ? mySubmission(assignment.id) : undefined;

  const teacherStats = useMemo(() => {
    if (!assignment) return null;
    const roster = rosterFor(cls.id);
    const subs = submissions.filter((s) => s.assignment_id === assignment.id);
    return {
      total: roster.length,
      submitted: subs.filter((s) => s.submitted_at).length,
      graded: subs.filter((s) => s.graded_at).length,
    };
  }, [assignment, submissions, rosterFor, cls.id]);

  if (!assignment || assignment.class_id !== cls.id) {
    return <div className="empty">Assignment not found.</div>;
  }

  const isCourseTeacher = currentUser?.id === cls.teacher_id;
  const isStudent = currentUser?.role === 'student';
  const isQuiz = assignment.submission_kind === 'quiz';
  const questionCount = quizQuestions.filter((q) => q.assignment_id === assignment.id).length;
  const status = submissionStatus(assignment, sub);

  const submit = async () => {
    if (!currentUser) return;
    setBusy(true);
    try {
      await repo.submitWork(assignment.id, currentUser.id, {
        body: assignment.submission_kind === 'text' ? body.trim() || null : null,
        url: assignment.submission_kind === 'url' ? url.trim() || null : null,
      });
      setBody('');
      setUrl('');
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Link to="../assignments" className="muted" style={{ fontSize: '0.82rem' }}>
        ← All assignments
      </Link>
      <div className="row-between" style={{ margin: '0.5rem 0 0.25rem' }}>
        <h2 style={{ margin: 0 }}>{assignment.title}</h2>
        {isCourseTeacher && (
          <Link to="speedgrader" className="btn small">
            SpeedGrader →
          </Link>
        )}
      </div>
      <p className="sub">
        <span className="chip" style={{ textTransform: 'capitalize' }}>{assignment.type}</span>{' '}
        {assignment.points_possible} pts ·{' '}
        Due {parseISO(assignment.due_date).toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        })}{' '}
        ({dueLabel(assignment.due_date)})
      </p>

      {assignment.description && (
        <div className="card subtle" style={{ margin: '1rem 0', whiteSpace: 'pre-wrap' }}>
          {assignment.description}
        </div>
      )}
      {assignment.link && (
        <p>
          <a href={assignment.link} target="_blank" rel="noreferrer" className="btn ghost small">
            🔗 Resource
          </a>
        </p>
      )}

      {isCourseTeacher && teacherStats && (
        <div className="stat-row">
          <div className="stat-tile">
            <strong>{teacherStats.submitted}</strong>
            <span>submitted of {teacherStats.total}</span>
          </div>
          <div className="stat-tile">
            <strong>{teacherStats.graded}</strong>
            <span>graded</span>
          </div>
          <div className="stat-tile">
            <strong>{teacherStats.submitted - teacherStats.graded}</strong>
            <span>needs grading</span>
          </div>
        </div>
      )}

      {isStudent && (
        <div className="section" style={{ marginTop: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', margin: '0 0 0.6rem' }}>
            Submission <span className={`chip status-${status}`}>{STATUS_LABELS[status]}</span>
          </h3>

          {sub?.graded_at && sub.score != null && (
            <div className="card grade-result">
              <strong>
                {sub.score} / {assignment.points_possible}
              </strong>
              {sub.grade_comment && <p className="sub" style={{ margin: '4px 0 0' }}>💬 {sub.grade_comment}</p>}
            </div>
          )}

          {sub?.submitted_at && (
            <div className="card subtle" style={{ margin: '0.6rem 0' }}>
              <p className="muted" style={{ fontSize: '0.78rem', margin: '0 0 4px' }}>
                Turned in{' '}
                {new Date(sub.submitted_at).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
              {sub.body && !isQuiz && <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{sub.body}</p>}
              {sub.url && (
                <a href={sub.url} target="_blank" rel="noreferrer">{sub.url}</a>
              )}
              {isQuiz && <p style={{ margin: 0 }} className="muted">Quiz attempt recorded.</p>}
            </div>
          )}

          {isQuiz ? (
            !sub?.submitted_at && (
              <Link to={`../quizzes/${assignment.id}/take`} className="btn">
                {questionCount > 0 ? `Take the quiz (${questionCount} questions)` : 'Quiz not ready yet'}
              </Link>
            )
          ) : assignment.submission_kind === 'none' ? (
            <p className="muted">This work is turned in on paper — nothing to submit online.</p>
          ) : (
            <div className="card">
              {assignment.submission_kind === 'text' ? (
                <div className="field">
                  <label>{sub?.submitted_at ? 'Re-submit text entry' : 'Text entry'}</label>
                  <textarea
                    value={body}
                    style={{ minHeight: 120 }}
                    placeholder="Type or paste your work…"
                    onChange={(e) => setBody(e.target.value)}
                  />
                </div>
              ) : (
                <div className="field">
                  <label>{sub?.submitted_at ? 'Re-submit website URL' : 'Website URL'}</label>
                  <input
                    value={url}
                    placeholder="https://…"
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
              )}
              <div className="row-between">
                <span />
                <button
                  className="btn small"
                  disabled={
                    busy ||
                    (assignment.submission_kind === 'text' ? !body.trim() : !url.trim())
                  }
                  onClick={submit}
                >
                  {busy ? 'Submitting…' : sub?.submitted_at ? 'Re-submit' : 'Submit assignment'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
