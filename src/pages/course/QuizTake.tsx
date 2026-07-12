import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import type { ClassInfo } from '../../lib/types';

/**
 * Practice mode for a student-made quiz (Quizlet-style). Answer the cards, get
 * instant per-question feedback and a score, then retry as often as you like.
 * Nothing is recorded — it's just practice.
 */
export default function QuizTake({ cls }: { cls: ClassInfo }) {
  const { quizId } = useParams<{ quizId: string }>();
  const { practiceQuizzes, practiceQuestions, profileById } = useApp();

  const quiz = practiceQuizzes.find((q) => q.id === quizId && q.class_id === cls.id);
  const questions = useMemo(
    () =>
      practiceQuestions
        .filter((q) => q.quiz_id === quizId)
        .sort((a, b) => a.position - b.position),
    [practiceQuestions, quizId],
  );

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!quiz) return <div className="empty">Quiz not found.</div>;

  const author = profileById(quiz.author_id);
  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] != null);
  const score = questions.reduce(
    (n, q) => n + (answers[q.id] === q.correct_index ? 1 : 0),
    0,
  );
  const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;

  const retry = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <div>
      <Link to="../quizzes" className="muted" style={{ fontSize: '0.82rem' }}>
        ← All practice quizzes
      </Link>
      <h2 style={{ margin: '0.5rem 0 0.25rem' }}>📚 {quiz.title}</h2>
      <p className="sub" style={{ marginBottom: '1.25rem' }}>
        {questions.length} card{questions.length === 1 ? '' : 's'} · made by{' '}
        {author?.name.replace(/ \(Student\)$/, '')} · practice mode (not graded)
      </p>

      {submitted && (
        <div className="card practice-scoreboard">
          <div style={{ fontSize: '2rem' }}>{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '📖'}</div>
          <div>
            <strong style={{ fontSize: '1.4rem' }}>
              {score} / {questions.length}
            </strong>{' '}
            <span className="muted">({pct}%)</span>
            <p className="sub" style={{ margin: '2px 0 0' }}>
              {pct >= 80 ? 'Great job!' : 'Keep practicing — try again!'}
            </p>
          </div>
          <button className="btn small" onClick={retry} style={{ marginLeft: 'auto' }}>
            ↻ Try again
          </button>
        </div>
      )}

      {questions.length === 0 ? (
        <div className="empty">This quiz has no cards yet.</div>
      ) : (
        <div className="stack" style={{ gap: '0.85rem' }}>
          {questions.map((q, i) => {
            const chosen = answers[q.id];
            return (
              <div key={q.id} className="card">
                <div className="row-between" style={{ marginBottom: '0.5rem' }}>
                  <strong>
                    {i + 1}. {q.question}
                  </strong>
                </div>
                <div className="quiz-choices">
                  {q.choices.map((c, ci) => {
                    let cls2 = 'quiz-choice';
                    if (submitted) {
                      if (ci === q.correct_index) cls2 += ' correct';
                      else if (ci === chosen) cls2 += ' incorrect';
                    } else if (chosen === ci) {
                      cls2 += ' selected';
                    }
                    return (
                      <label key={ci} className={cls2}>
                        <input
                          type="radio"
                          name={q.id}
                          disabled={submitted}
                          checked={chosen === ci}
                          onChange={() => setAnswers((p) => ({ ...p, [q.id]: ci }))}
                        />
                        {c}
                        {submitted && ci === q.correct_index && (
                          <span className="mark">✓</span>
                        )}
                        {submitted && ci === chosen && ci !== q.correct_index && (
                          <span className="mark">✗</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {!submitted && (
            <div className="row-between">
              <span className="muted" style={{ fontSize: '0.82rem' }}>
                {Object.keys(answers).length}/{questions.length} answered
              </span>
              <button className="btn" disabled={!allAnswered} onClick={() => setSubmitted(true)}>
                Check answers
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
