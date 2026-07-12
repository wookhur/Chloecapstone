import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { dueLabel, today } from '../../lib/dates';
import { STATUS_LABELS, submissionStatus } from '../../lib/grades';
import * as repo from '../../lib/repository';
import {
  ASSIGNMENT_TYPES,
  type Assignment,
  type AssignmentType,
  type ClassInfo,
  type SubmissionKind,
} from '../../lib/types';

const TYPE_EMOJI: Record<Assignment['type'], string> = {
  homework: '📝',
  quiz: '❓',
  test: '📄',
  project: '📦',
};

export default function AssignmentsTab({ cls }: { cls: ClassInfo }) {
  const { currentUser, assignments, mySubmission, refresh } = useApp();
  const [showForm, setShowForm] = useState(false);

  const isCourseTeacher = currentUser?.id === cls.teacher_id;
  const isStudent = currentUser?.role === 'student';

  const { upcoming, past } = useMemo(() => {
    const list = assignments
      .filter((a) => a.class_id === cls.id)
      .sort((a, b) => a.due_date.localeCompare(b.due_date));
    const t = today();
    return {
      upcoming: list.filter((a) => a.due_date >= t),
      past: list.filter((a) => a.due_date < t).reverse(),
    };
  }, [assignments, cls.id]);

  const renderRow = (a: Assignment) => {
    const status = isStudent ? submissionStatus(a, mySubmission(a.id)) : null;
    return (
      <li key={a.id} className="list-row assignment-row">
        <div>
          <span style={{ marginRight: 6 }}>{TYPE_EMOJI[a.type]}</span>
          <Link to={`../assignments/${a.id}`} style={{ fontWeight: 600 }}>
            {a.title}
          </Link>
          <div className="muted" style={{ fontSize: '0.78rem', marginTop: 2 }}>
            {dueLabel(a.due_date)} · {a.points_possible} pts
          </div>
        </div>
        <div className="inline" style={{ gap: '0.4rem' }}>
          {status && (
            <span className={`chip status-${status}`}>{STATUS_LABELS[status]}</span>
          )}
          {isCourseTeacher && (
            <Link to={`../assignments/${a.id}/speedgrader`} className="btn ghost small">
              SpeedGrader
            </Link>
          )}
        </div>
      </li>
    );
  };

  return (
    <div>
      <div className="row-between" style={{ marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Assignments</h2>
        {isCourseTeacher && (
          <button className="btn small" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : '+ Assignment'}
          </button>
        )}
      </div>

      {showForm && (
        <NewAssignmentForm
          cls={cls}
          teacherId={currentUser!.id}
          onDone={async () => {
            setShowForm(false);
            await refresh();
          }}
        />
      )}

      {upcoming.length === 0 && past.length === 0 ? (
        <div className="empty">No assignments yet.</div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="section">
              <h3 className="group-label">Upcoming</h3>
              <ul className="plain-list boxed">{upcoming.map(renderRow)}</ul>
            </div>
          )}
          {past.length > 0 && (
            <div className="section">
              <h3 className="group-label">Past</h3>
              <ul className="plain-list boxed">{past.map(renderRow)}</ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function NewAssignmentForm({
  cls,
  teacherId,
  onDone,
}: {
  cls: ClassInfo;
  teacherId: string;
  onDone: () => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<AssignmentType>('homework');
  const [dueDate, setDueDate] = useState(today());
  const [points, setPoints] = useState(10);
  const [kind, setKind] = useState<SubmissionKind>('text');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await repo.createAssignment({
        class_id: cls.id,
        title: title.trim(),
        description: description.trim() || null,
        assigned_date: today(),
        due_date: dueDate,
        type,
        link: null,
        points_possible: points,
        submission_kind: kind,
        published: true,
        created_by: teacherId,
      });
      await onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div className="inline" style={{ gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="field" style={{ flex: '1 1 220px' }}>
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field" style={{ flex: '0 0 130px' }}>
          <label>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as AssignmentType)}>
            {ASSIGNMENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="field" style={{ flex: '0 0 150px' }}>
          <label>Due date</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div className="field" style={{ flex: '0 0 90px' }}>
          <label>Points</label>
          <input
            type="number"
            min={0}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
          />
        </div>
        <div className="field" style={{ flex: '0 0 170px' }}>
          <label>Submission</label>
          <select value={kind} onChange={(e) => setKind(e.target.value as SubmissionKind)}>
            <option value="text">Text entry</option>
            <option value="url">Website URL</option>
            <option value="quiz">Online quiz</option>
            <option value="none">On paper / none</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label>Instructions</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="row-between">
        <span className="muted" style={{ fontSize: '0.8rem' }}>
          Quiz-type assignments get questions on the Quizzes tab.
        </span>
        <button className="btn small" disabled={!title.trim() || busy} onClick={submit}>
          {busy ? 'Saving…' : 'Create assignment'}
        </button>
      </div>
    </div>
  );
}
