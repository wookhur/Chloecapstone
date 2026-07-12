import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { dueLabel } from '../../lib/dates';
import * as repo from '../../lib/repository';
import type { Assignment, ClassInfo } from '../../lib/types';

/** Quizzes tab: online quizzes/tests. Teachers manage questions here. */
export default function QuizzesTab({ cls }: { cls: ClassInfo }) {
  const { currentUser, assignments, quizQuestions, mySubmission } = useApp();
  const [managing, setManaging] = useState<string | null>(null);

  const isCourseTeacher = currentUser?.id === cls.teacher_id;
  const isStudent = currentUser?.role === 'student';

  const quizzes = assignments
    .filter((a) => a.class_id === cls.id && a.submission_kind === 'quiz')
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  return (
    <div>
      <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem' }}>Quizzes</h2>
      <p className="sub" style={{ marginBottom: '1rem' }}>
        Online quizzes are graded automatically when submitted.
        {isCourseTeacher && ' Create one from the Assignments tab with submission type "Online quiz".'}
      </p>

      {quizzes.length === 0 ? (
        <div className="empty">No online quizzes yet.</div>
      ) : (
        <div className="stack" style={{ gap: '0.75rem' }}>
          {quizzes.map((q) => {
            const questions = quizQuestions
              .filter((qq) => qq.assignment_id === q.id)
              .sort((a, b) => a.position - b.position);
            const sub = isStudent ? mySubmission(q.id) : undefined;
            return (
              <div key={q.id} className="card">
                <div className="row-between">
                  <div>
                    <Link to={`../assignments/${q.id}`} style={{ fontWeight: 600 }}>
                      ❓ {q.title}
                    </Link>
                    <div className="muted" style={{ fontSize: '0.8rem', marginTop: 2 }}>
                      {questions.length} question{questions.length === 1 ? '' : 's'} ·{' '}
                      {q.points_possible} pts · {dueLabel(q.due_date)}
                    </div>
                  </div>
                  <div className="inline" style={{ gap: '0.4rem' }}>
                    {isStudent &&
                      (sub?.submitted_at ? (
                        <span className="chip status-graded">
                          Score: {sub.score ?? '—'}/{q.points_possible}
                        </span>
                      ) : questions.length > 0 ? (
                        <Link to={`../quizzes/${q.id}/take`} className="btn small">
                          Take quiz
                        </Link>
                      ) : (
                        <span className="chip">Not ready</span>
                      ))}
                    {isCourseTeacher && (
                      <button
                        className="btn secondary small"
                        onClick={() => setManaging(managing === q.id ? null : q.id)}
                      >
                        {managing === q.id ? 'Close' : `Questions (${questions.length})`}
                      </button>
                    )}
                  </div>
                </div>
                {managing === q.id && isCourseTeacher && (
                  <QuestionManager assignment={q} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuestionManager({ assignment }: { assignment: Assignment }) {
  const { quizQuestions, refresh } = useApp();
  const [question, setQuestion] = useState('');
  const [choices, setChoices] = useState(['', '', '', '']);
  const [correct, setCorrect] = useState(0);
  const [points, setPoints] = useState(2);
  const [busy, setBusy] = useState(false);

  const questions = quizQuestions
    .filter((q) => q.assignment_id === assignment.id)
    .sort((a, b) => a.position - b.position);

  const filledChoices = choices.map((c) => c.trim()).filter(Boolean);
  const canAdd = question.trim() && filledChoices.length >= 2 && correct < filledChoices.length;

  const add = async () => {
    if (!canAdd) return;
    setBusy(true);
    try {
      await repo.createQuizQuestion({
        assignment_id: assignment.id,
        position: questions.length + 1,
        question: question.trim(),
        choices: filledChoices,
        correct_index: correct,
        points,
      });
      setQuestion('');
      setChoices(['', '', '', '']);
      setCorrect(0);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card subtle" style={{ marginTop: '0.75rem' }}>
      {questions.map((q, i) => (
        <div key={q.id} className="quiz-question-row">
          <div>
            <strong>Q{i + 1}.</strong> {q.question}{' '}
            <span className="muted">({q.points} pts)</span>
            <div className="muted" style={{ fontSize: '0.78rem' }}>
              ✓ {q.choices[q.correct_index]}
            </div>
          </div>
          <button
            className="btn ghost small"
            onClick={async () => {
              await repo.deleteQuizQuestion(q.id);
              await refresh();
            }}
          >
            Remove
          </button>
        </div>
      ))}
      <div className="divider" />
      <div className="field">
        <label>New question</label>
        <input value={question} onChange={(e) => setQuestion(e.target.value)} />
      </div>
      <div className="inline" style={{ gap: '0.6rem', flexWrap: 'wrap' }}>
        {choices.map((c, i) => (
          <div key={i} className="field" style={{ flex: '1 1 40%', marginBottom: '0.5rem' }}>
            <label className="inline" style={{ gap: '0.35rem' }}>
              <input
                type="radio"
                name={`correct-${assignment.id}`}
                checked={correct === i}
                onChange={() => setCorrect(i)}
                style={{ width: 'auto' }}
              />
              Choice {i + 1} {correct === i && <span className="hint">(correct)</span>}
            </label>
            <input value={c} onChange={(e) => setChoices(choices.map((x, j) => (j === i ? e.target.value : x)))} />
          </div>
        ))}
      </div>
      <div className="row-between">
        <div className="field inline" style={{ marginBottom: 0, gap: '0.4rem' }}>
          <label style={{ marginBottom: 0 }}>Points</label>
          <input
            type="number"
            min={1}
            value={points}
            style={{ width: 72 }}
            onChange={(e) => setPoints(Number(e.target.value))}
          />
        </div>
        <button className="btn small" disabled={!canAdd || busy} onClick={add}>
          {busy ? 'Adding…' : 'Add question'}
        </button>
      </div>
    </div>
  );
}
