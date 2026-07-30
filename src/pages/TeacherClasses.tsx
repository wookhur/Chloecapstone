import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import AssignmentCard from '../components/AssignmentCard';
import * as repo from '../lib/repository';
import { today } from '../lib/dates';
import { subjectColor } from '../lib/subjectColor';
import {
  ASSIGNMENT_TYPES,
  SCHOOL_YEAR,
  SUBJECTS,
  type Assignment,
  type AssignmentType,
  type ClassInfo,
} from '../lib/types';

export default function TeacherClasses() {
  const { currentUser, classes, assignments, refresh } = useApp();
  const [showNewClass, setShowNewClass] = useState(false);

  if (!currentUser) return <div className="empty">Select a user to begin.</div>;
  if (currentUser.role !== 'teacher') {
    return <div className="empty">This page is for teachers. Switch to a teacher account.</div>;
  }

  const myClasses = classes.filter((c) => c.teacher_id === currentUser.id);

  return (
    <div>
      <div className="page-head">
        <h1>My Classes</h1>
        <p>Create your classes and post homework for {SCHOOL_YEAR}.</p>
      </div>

      <div className="callout">
        <span className="callout-icon">💡</span>
        <div>
          <strong>Post a due date for every assignment — even paper handouts.</strong>
          <p style={{ margin: '4px 0 0' }}>
            When the due date lives here, students turn work in on time, so you grade
            each assignment <em>once</em> instead of chasing late makeups — and the
            posted date is a clear, shared record everyone can point to.
          </p>
        </div>
      </div>

      <div className="row-between" style={{ marginBottom: '1rem' }}>
        <span className="muted">{myClasses.length} class{myClasses.length === 1 ? '' : 'es'}</span>
        <button
          className={`btn small ${showNewClass ? "secondary" : ""}`}
          onClick={() => setShowNewClass((v) => !v)}
        >
          {showNewClass ? 'Cancel' : '+ Add a class'}
        </button>
      </div>

      {showNewClass && (
        <NewClassForm
          teacherId={currentUser.id}
          onCreated={async () => { setShowNewClass(false); await refresh(); }}
        />
      )}

      {myClasses.length === 0 && !showNewClass ? (
        <div className="empty">You haven't created any classes yet. Click “Add a class”.</div>
      ) : (
        <div className="stack">
          {myClasses.map((c) => (
            <ClassBlock
              key={c.id}
              cls={c}
              assignments={assignments.filter((a) => a.class_id === c.id)}
              onChanged={refresh}
              teacherId={currentUser.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NewClassForm({
  teacherId,
  onCreated,
}: {
  teacherId: string;
  onCreated: () => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [grade, setGrade] = useState(10);
  const [period, setPeriod] = useState('P1');
  const [room, setRoom] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await repo.createClass({
        name: name.trim(),
        subject,
        grade_level: grade,
        teacher_id: teacherId,
        period,
        room: room.trim() || null,
        school_year: SCHOOL_YEAR,
      });
      await onCreated();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div className="inline" style={{ gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="field" style={{ flex: '1 1 200px' }}>
          <label>Class name</label>
          <input aria-label="Class name" type="text" value={name} placeholder="e.g. Algebra II" onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field" style={{ flex: '0 0 160px' }}>
          <label>Subject</label>
          <select aria-label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: '0 0 100px' }}>
          <label>Grade</label>
          <select aria-label="Grade" value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
            {[9, 10, 11, 12].map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: '0 0 90px' }}>
          <label>Period</label>
          <input aria-label="Period" type="text" value={period} onChange={(e) => setPeriod(e.target.value)} />
        </div>
        <div className="field" style={{ flex: '0 0 110px' }}>
          <label>Room</label>
          <input aria-label="Room" type="text" value={room} onChange={(e) => setRoom(e.target.value)} />
        </div>
      </div>
      <div className="row-between">
        <span />
        <button className="btn small" onClick={submit} disabled={!name.trim() || busy}>
          {busy ? 'Creating…' : 'Create class'}
        </button>
      </div>
    </div>
  );
}

function ClassBlock({
  cls,
  assignments,
  onChanged,
  teacherId,
}: {
  cls: ClassInfo;
  assignments: Assignment[];
  onChanged: () => Promise<void>;
  teacherId: string;
}) {
  const [posting, setPosting] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const color = subjectColor(cls.subject);

  const sorted = useMemo(
    () => [...assignments].sort((a, b) => b.due_date.localeCompare(a.due_date)),
    [assignments],
  );

  const remove = async (id: string) => {
    await repo.deleteAssignment(id);
    if (editing?.id === id) setEditing(null); // don't leave a form editing a deleted row
    await onChanged();
  };

  return (
    <div className="card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="row-between">
        <div>
          <h3 style={{ margin: 0 }}>{cls.name}</h3>
          <p className="sub" style={{ marginTop: 2 }}>
            {cls.subject} · Grade {cls.grade_level} · {cls.period} · Room {cls.room ?? '—'}
          </p>
        </div>
        <button
          className="btn small"
          onClick={() => { setPosting((v) => !v); setEditing(null); }}
        >
          {posting ? 'Cancel' : '+ Post homework'}
        </button>
      </div>

      {(posting || editing) && (
        // key: remount the form when the target changes, so its initial state is
        // re-read. Without it, editing A then B would save A's values onto B.
        <AssignmentForm
          key={editing?.id ?? 'new'}
          classId={cls.id}
          teacherId={teacherId}
          existing={editing}
          onDone={async () => { setPosting(false); setEditing(null); await onChanged(); }}
        />
      )}

      <div className="divider" />
      {sorted.length === 0 ? (
        <p className="meta">No homework posted yet.</p>
      ) : (
        <div className="grid cols-2">
          {sorted.map((a) => (
            <AssignmentCard
              key={a.id}
              assignment={a}
              cls={cls}
              onEdit={() => { setEditing(a); setPosting(false); }}
              onDelete={() => remove(a.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AssignmentForm({
  classId,
  teacherId,
  existing,
  onDone,
}: {
  classId: string;
  teacherId: string;
  existing: Assignment | null;
  onDone: () => Promise<void>;
}) {
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [type, setType] = useState<AssignmentType>(existing?.type ?? 'homework');
  const [dueDate, setDueDate] = useState(existing?.due_date ?? today());
  const [link, setLink] = useState(existing?.link ?? '');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      if (existing) {
        await repo.updateAssignment(existing.id, {
          title: title.trim(),
          description: description.trim() || null,
          type,
          due_date: dueDate,
          link: link.trim() || null,
        });
      } else {
        await repo.createAssignment({
          class_id: classId,
          title: title.trim(),
          description: description.trim() || null,
          assigned_date: today(),
          due_date: dueDate,
          type,
          link: link.trim() || null,
          created_by: teacherId,
        });
      }
      await onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card subtle" style={{ marginTop: '0.85rem' }}>
      <div className="inline" style={{ gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="field" style={{ flex: '1 1 240px' }}>
          <label>Title</label>
          <input aria-label="Title" type="text" value={title} placeholder="e.g. Chapter 4 worksheet" onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field" style={{ flex: '0 0 150px' }}>
          <label>Type</label>
          <select aria-label="Type" value={type} onChange={(e) => setType(e.target.value as AssignmentType)}>
            {ASSIGNMENT_TYPES.map((t) => (
              <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>
            ))}
          </select>
        </div>
        <div className="field" style={{ flex: '0 0 170px' }}>
          <label>Due date</label>
          <input aria-label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Details <span className="hint">(optional)</span></label>
        <textarea aria-label="Details" value={description} placeholder="Instructions, page numbers, etc." onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="field">
        <label>Resource link <span className="hint">(optional)</span></label>
        <input aria-label="Resource link" type="text" value={link} placeholder="https://…" onChange={(e) => setLink(e.target.value)} />
      </div>
      <div className="row-between">
        <span className="muted" style={{ fontSize: '0.8rem' }}>
          {existing ? 'Editing an assignment' : 'New assignment'}
        </span>
        <button className="btn small" onClick={submit} disabled={!title.trim() || busy}>
          {busy ? 'Saving…' : existing ? 'Save changes' : 'Post homework'}
        </button>
      </div>
    </div>
  );
}
