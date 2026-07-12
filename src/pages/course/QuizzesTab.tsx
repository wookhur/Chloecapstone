import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import * as repo from '../../lib/repository';
import type { ClassInfo, PracticeQuestion } from '../../lib/types';

/**
 * Quizlet-style practice quizzes. Any student (or the teacher) can create a
 * quiz for the course; classmates can practice it as many times as they want.
 * Nothing is graded — it's pure self-check practice.
 */
export default function QuizzesTab({ cls }: { cls: ClassInfo }) {
  const { currentUser, practiceQuizzes, practiceQuestions, profileById, refresh } = useApp();
  const [creating, setCreating] = useState(false);

  const quizzes = practiceQuizzes
    .filter((q) => q.class_id === cls.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div>
      <div className="row-between" style={{ marginBottom: '0.35rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Practice Quizzes</h2>
        <button className="btn small" onClick={() => setCreating((v) => !v)}>
          {creating ? 'Cancel' : '+ Make a quiz'}
        </button>
      </div>
      <p className="sub" style={{ marginBottom: '1rem' }}>
        Made by students, for students. Create a quiz to help your classmates study,
        or practice one below — it's not graded, so practice as much as you like. 📚
      </p>

      {creating && currentUser && (
        <QuizBuilder
          cls={cls}
          authorId={currentUser.id}
          onDone={async () => {
            setCreating(false);
            await refresh();
          }}
        />
      )}

      {quizzes.length === 0 ? (
        <div className="empty">No practice quizzes yet — be the first to make one!</div>
      ) : (
        <div className="quiz-card-grid">
          {quizzes.map((q) => {
            const count = practiceQuestions.filter((x) => x.quiz_id === q.id).length;
            const author = profileById(q.author_id);
            const mine = q.author_id === currentUser?.id;
            return (
              <div key={q.id} className="card quiz-card">
                <div>
                  <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>{q.title}</h3>
                  {q.description && (
                    <p className="sub" style={{ margin: '0 0 0.5rem' }}>{q.description}</p>
                  )}
                  <p className="muted" style={{ fontSize: '0.78rem', margin: 0 }}>
                    <span className="avatar">{author?.name.charAt(0) ?? '?'}</span>
                    {author?.name.replace(/ \(Student\)$/, '')} · {count} card
                    {count === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="inline" style={{ gap: '0.4rem', marginTop: '0.75rem' }}>
                  {count > 0 ? (
                    <Link to={`../quizzes/${q.id}/practice`} className="btn small">
                      ▶ Practice
                    </Link>
                  ) : (
                    <span className="chip">No cards yet</span>
                  )}
                  {mine && (
                    <button
                      className="btn ghost small"
                      onClick={async () => {
                        await repo.deletePracticeQuiz(q.id);
                        await refresh();
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Two-step builder: name the quiz, then add multiple-choice questions to it. */
function QuizBuilder({
  cls,
  authorId,
  onDone,
}: {
  cls: ClassInfo;
  authorId: string;
  onDone: () => Promise<void>;
}) {
  const { practiceQuestions, refresh } = useApp();
  const [quizId, setQuizId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const createQuiz = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const quiz = await repo.createPracticeQuiz({
        class_id: cls.id,
        author_id: authorId,
        title: title.trim(),
        description: description.trim() || null,
      });
      await refresh();
      setQuizId(quiz.id);
    } finally {
      setBusy(false);
    }
  };

  if (!quizId) {
    return (
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="field">
          <label>Quiz title</label>
          <input
            value={title}
            placeholder="e.g. Chapter 3 vocab"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Description <span className="hint">(optional)</span></label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="row-between">
          <span />
          <button className="btn small" disabled={!title.trim() || busy} onClick={createQuiz}>
            {busy ? 'Creating…' : 'Create & add questions →'}
          </button>
        </div>
      </div>
    );
  }

  const questions = practiceQuestions
    .filter((q) => q.quiz_id === quizId)
    .sort((a, b) => a.position - b.position);

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div className="row-between" style={{ marginBottom: '0.5rem' }}>
        <strong>“{title}” · {questions.length} card{questions.length === 1 ? '' : 's'}</strong>
        <button className="btn small" onClick={onDone}>Done</button>
      </div>
      <div className="divider" />
      {questions.map((q, i) => (
        <div key={q.id} className="quiz-question-row">
          <div>
            <strong>Q{i + 1}.</strong> {q.question}
            <div className="muted" style={{ fontSize: '0.78rem' }}>✓ {q.choices[q.correct_index]}</div>
          </div>
          <button
            className="btn ghost small"
            onClick={async () => {
              await repo.deletePracticeQuestion(q.id);
              await refresh();
            }}
          >
            Remove
          </button>
        </div>
      ))}
      <QuestionEditor quizId={quizId} nextPosition={questions.length + 1} onAdded={refresh} />
    </div>
  );
}

function QuestionEditor({
  quizId,
  nextPosition,
  onAdded,
}: {
  quizId: string;
  nextPosition: number;
  onAdded: () => Promise<void>;
}) {
  const [question, setQuestion] = useState('');
  const [choices, setChoices] = useState(['', '', '', '']);
  const [correct, setCorrect] = useState(0);
  const [busy, setBusy] = useState(false);

  const filled = choices.map((c) => c.trim()).filter(Boolean);
  const canAdd = question.trim() && filled.length >= 2 && correct < filled.length;

  const add = async () => {
    if (!canAdd) return;
    setBusy(true);
    try {
      const q: Omit<PracticeQuestion, 'id'> = {
        quiz_id: quizId,
        position: nextPosition,
        question: question.trim(),
        choices: filled,
        correct_index: correct,
      };
      await repo.createPracticeQuestion(q);
      setQuestion('');
      setChoices(['', '', '', '']);
      setCorrect(0);
      await onAdded();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card subtle" style={{ marginTop: '0.75rem' }}>
      <div className="field">
        <label>New question</label>
        <input value={question} onChange={(e) => setQuestion(e.target.value)} />
      </div>
      <div className="inline" style={{ gap: '0.6rem', flexWrap: 'wrap' }}>
        {choices.map((c, i) => (
          <div key={i} className="field builder-choice">
            <label className="inline" style={{ gap: '0.35rem' }}>
              <input
                type="radio"
                name={`correct-${quizId}`}
                checked={correct === i}
                onChange={() => setCorrect(i)}
                style={{ width: 'auto' }}
              />
              Choice {i + 1} {correct === i && <span className="hint">(correct)</span>}
            </label>
            <input
              value={c}
              onChange={(e) => setChoices(choices.map((x, j) => (j === i ? e.target.value : x)))}
            />
          </div>
        ))}
      </div>
      <div className="row-between">
        <span className="muted" style={{ fontSize: '0.78rem' }}>
          Fill at least 2 choices and mark the correct one.
        </span>
        <button className="btn small" disabled={!canAdd || busy} onClick={add}>
          {busy ? 'Adding…' : '+ Add card'}
        </button>
      </div>
    </div>
  );
}
