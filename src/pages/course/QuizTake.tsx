import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import type { ClassInfo } from '../../lib/types';
import { displayName } from '../../lib/names';
import { bankFor, dedupe, shuffle, type BankCard } from '../../lib/quizBank';
import Icon from '../../components/Icon';

/**
 * Practice mode (Quizlet-style). Answer the cards, get instant per-question
 * feedback and a score, then retry as often as you like. Nothing is recorded —
 * it's just practice.
 *
 * Two sources: one student's quiz, or `mode="bank"` for every card the class
 * has written, shuffled together. The bank is the one you actually want the
 * night before a test.
 */
export default function QuizTake({
  cls,
  mode = 'quiz',
}: {
  cls: ClassInfo;
  mode?: 'quiz' | 'bank';
}) {
  const { quizId } = useParams<{ quizId: string }>();
  const { practiceQuizzes, practiceQuestions, profileById } = useApp();

  const quiz = practiceQuizzes.find((q) => q.id === quizId && q.class_id === cls.id);

  // Reshuffling is a state change, not a render-time roll: with Math.random()
  // in the body the cards would reorder every time an answer was picked.
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const bank = useMemo(
    () => (mode === 'bank' ? dedupe(bankFor(practiceQuizzes, practiceQuestions, cls.id)) : []),
    [mode, practiceQuizzes, practiceQuestions, cls.id],
  );

  const questions = useMemo(() => {
    if (mode === 'bank') return shuffle(bank, seed);
    return practiceQuestions
      .filter((q) => q.quiz_id === quizId)
      .sort((a, b) => a.position - b.position);
  }, [mode, bank, seed, practiceQuestions, quizId]);

  const sourceCount = useMemo(() => new Set(bank.map((c) => c.quiz_id)).size, [bank]);

  if (mode === 'quiz' && !quiz) return <div className="empty">Quiz not found.</div>;

  const author = quiz ? profileById(quiz.author_id) : null;
  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] != null);
  const score = questions.reduce(
    (n, q) => n + (answers[q.id] === q.correct_index ? 1 : 0),
    0,
  );
  const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;

  const retry = () => {
    setAnswers({});
    setSubmitted(false);
    if (mode === 'bank') setSeed(Math.floor(Math.random() * 2 ** 31));
  };

  return (
    <div>
      <Link to="../quizzes" className="meta">
        <Icon name="chevron-left" size="0.9em" /> All practice quizzes
      </Link>
      <h2 className="detail-head">
        {mode === 'bank' ? `${cls.name} question bank` : quiz!.title}
      </h2>
      <p className="sub mb-5">
        {questions.length} card{questions.length === 1 ? '' : 's'} ·{' '}
        {mode === 'bank'
          ? `shuffled from ${sourceCount} ${sourceCount === 1 ? 'quiz' : 'quizzes'} the class made`
          : `made by ${displayName(author)}`}{' '}
        · practice mode (not graded)
      </p>

      {submitted && (
        <div className="card practice-scoreboard">
          <div className="score-ring" data-tier={pct >= 80 ? 'high' : pct >= 60 ? 'mid' : 'low'}>
            {pct}<span>%</span>
          </div>
          <div>
            <strong className="text-xl">
              {score} / {questions.length}
            </strong>{' '}
            <span className="muted">({pct}%)</span>
            <p className="sub caption">
              {pct >= 80 ? 'Great job!' : 'Keep practicing — try again!'}
            </p>
          </div>
          <button className="btn small ml-auto" onClick={retry}>
            <><Icon name="refresh" />{mode === 'bank' ? 'Reshuffle' : 'Try again'}</>
          </button>
        </div>
      )}

      {questions.length === 0 ? (
        <div className="empty">
          {mode === 'bank'
            ? 'Nobody has written any cards for this class yet.'
            : 'This quiz has no cards yet.'}
        </div>
      ) : (
        <div className="stack gap-3">
          {questions.map((q, i) => {
            const chosen = answers[q.id];
            return (
              <div key={q.id} className="card">
                <div className="row-between mb-2">
                  <strong>
                    {i + 1}. {q.question}
                  </strong>
                  {mode === 'bank' && (
                    <span className="meta">{(q as BankCard).quizTitle}</span>
                  )}
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
                          <span className="mark"><Icon name="check" size="0.95em" /></span>
                        )}
                        {submitted && ci === chosen && ci !== q.correct_index && (
                          <span className="mark"><Icon name="x" size="0.95em" /></span>
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
              <span className="meta">
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
