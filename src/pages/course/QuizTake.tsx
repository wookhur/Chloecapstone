import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import * as repo from '../../lib/repository';
import type { ClassInfo } from '../../lib/types';

/** Student quiz-taking flow: answer every question, auto-grade on submit. */
export default function QuizTake({ cls }: { cls: ClassInfo }) {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { currentUser, assignments, quizQuestions, mySubmission, refresh } = useApp();

  const assignment = assignments.find((a) => a.id === assignmentId);
  const questions = useMemo(
    () =>
      quizQuestions
        .filter((q) => q.assignment_id === assignmentId)
        .sort((a, b) => a.position - b.position),
    [quizQuestions, assignmentId],
  );

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);

  if (!assignment || assignment.class_id !== cls.id) {
    return <div className="empty">Quiz not found.</div>;
  }
  if (currentUser?.role !== 'student') {
    return <div className="empty">Only students can take quizzes. (Teachers: manage questions on the Quizzes tab.)</div>;
  }

  const existing = mySubmission(assignment.id);
  if (existing?.submitted_at && !result) {
    return (
      <div>
        <div className="empty">
          You already took this quiz — score {existing.score ?? '—'}/{assignment.points_possible}.
          <br />
          <Link to={`../assignments/${assignment.id}`}>Back to the assignment →</Link>
        </div>
      </div>
    );
  }

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] != null);

  const submit = async () => {
    if (!allAnswered || !currentUser) return;
    setBusy(true);
    try {
      const score = questions.reduce(
        (sum, q) => sum + (answers[q.id] === q.correct_index ? q.points : 0),
        0,
      );
      await repo.submitWork(assignment.id, currentUser.id, {
        body: JSON.stringify({ quiz_answers: answers }),
        score,
        graded: true, // auto-graded
      });
      await refresh();
      setResult({ score, total: assignment.points_possible });
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
    return (
      <div className="quiz-result">
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '2.4rem' }}>{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '📚'}</div>
          <h2 style={{ margin: '0.5rem 0 0.25rem' }}>
            {result.score} / {result.total}
          </h2>
          <p className="muted">Your quiz was graded automatically.</p>
          <div className="inline" style={{ justifyContent: 'center', gap: '0.6rem' }}>
            <button className="btn secondary small" onClick={() => navigate(`../assignments/${assignment.id}`)}>
              Back to assignment
            </button>
            <button className="btn small" onClick={() => navigate('../grades')}>
              View grades
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link to="../quizzes" className="muted" style={{ fontSize: '0.82rem' }}>
        ← All quizzes
      </Link>
      <h2 style={{ margin: '0.5rem 0 0.25rem' }}>❓ {assignment.title}</h2>
      <p className="sub" style={{ marginBottom: '1.25rem' }}>
        {questions.length} questions · {assignment.points_possible} points · one attempt
      </p>

      {questions.length === 0 ? (
        <div className="empty">This quiz has no questions yet — check back later.</div>
      ) : (
        <div className="stack" style={{ gap: '0.85rem' }}>
          {questions.map((q, i) => (
            <div key={q.id} className="card">
              <div className="row-between" style={{ marginBottom: '0.5rem' }}>
                <strong>
                  Q{i + 1}. {q.question}
                </strong>
                <span className="muted" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                  {q.points} pts
                </span>
              </div>
              <div className="quiz-choices">
                {q.choices.map((c, ci) => (
                  <label
                    key={ci}
                    className={`quiz-choice ${answers[q.id] === ci ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === ci}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: ci }))}
                    />
                    {c}
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="row-between">
            <span className="muted" style={{ fontSize: '0.82rem' }}>
              {Object.keys(answers).length}/{questions.length} answered
            </span>
            <button className="btn" disabled={!allAnswered || busy} onClick={submit}>
              {busy ? 'Submitting…' : 'Submit quiz'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
