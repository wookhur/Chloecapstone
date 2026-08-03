import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { dueLabel, today } from '../../lib/dates';
import * as repo from '../../lib/repository';
import DoneCheckbox from '../../components/DoneCheckbox';
import BulkAssignments from './BulkAssignments';
import {
  ASSIGNMENT_TYPES,
  type Assignment,
  type AssignmentType,
  type ClassInfo,
} from '../../lib/types';
import Icon, { ASSIGNMENT_ICON } from '../../components/Icon';

/** Assignment listings for a course (informational — no online submission). */
export default function AssignmentsTab({ cls }: { cls: ClassInfo }) {
  const { currentUser, assignments, isDone, refresh } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);

  const isCourseTeacher = currentUser?.id === cls.teacher_id;

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
    const done = isDone(a.id);
    const overdue = !done && a.due_date < today();
    return (
      <li key={a.id} className={`list-row assignment-row ${done ? 'is-done' : ''}`}>
        <div className="inline" style={{ gap: '0.5rem' }}>
          <DoneCheckbox assignment={a} />
          <div>
          <Icon name={ASSIGNMENT_ICON[a.type]} className="type-glyph" />
          <Link to={`../assignments/${a.id}`} style={{ fontWeight: 600 }}>
            {a.title}
          </Link>
          <div className={`due ${overdue ? 'overdue' : ''}`} style={{ marginTop: 2 }}>
            {dueLabel(a.due_date)}
          </div>
          </div>
        </div>
        <span className="chip" style={{ textTransform: 'capitalize' }}>{a.type}</span>
      </li>
    );
  };

  return (
    <div>
      <div className="row-between" style={{ marginBottom: '1rem' }}>
        <h2 className="section-title">Assignments</h2>
        {isCourseTeacher && (
          <div className="inline" style={{ gap: '0.4rem' }}>
            <button
              className={`btn secondary small ${showBulk ? "on" : ""}`}
              onClick={() => { setShowBulk((v) => !v); setShowForm(false); }}
            >
              {showBulk ? 'Cancel' : <><Icon name="layers" size="0.9em" /> Add several</>}
            </button>
            <button
              className={`btn small ${showForm ? "secondary" : ""}`}
              onClick={() => { setShowForm((v) => !v); setShowBulk(false); }}
            >
              {showForm ? 'Cancel' : '+ Assignment'}
            </button>
          </div>
        )}
      </div>

      {showBulk && (
        <BulkAssignments
          cls={cls}
          teacherId={currentUser!.id}
          onDone={refresh}
        />
      )}

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
  const [link, setLink] = useState('');
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
        link: link.trim() || null,
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
          <input aria-label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field" style={{ flex: '0 0 130px' }}>
          <label>Type</label>
          <select aria-label="Type" value={type} onChange={(e) => setType(e.target.value as AssignmentType)}>
            {ASSIGNMENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="field" style={{ flex: '0 0 150px' }}>
          <label>Due date</label>
          <input aria-label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Instructions <span className="hint">(optional)</span></label>
        <textarea aria-label="Instructions" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="field">
        <label>Resource link <span className="hint">(optional)</span></label>
        <input aria-label="Resource link" value={link} placeholder="https://…" onChange={(e) => setLink(e.target.value)} />
      </div>
      <div className="row-between">
        <span />
        <button className="btn small" disabled={!title.trim() || busy} onClick={submit}>
          {busy ? 'Saving…' : 'Create assignment'}
        </button>
      </div>
    </div>
  );
}
