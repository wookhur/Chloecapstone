import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import * as repo from '../lib/repository';
import { subjectColor } from '../lib/subjectColor';
import { SCHOOL_YEAR, SUBJECTS } from '../lib/types';
import { displayName } from '../lib/names';
import Icon from '../components/Icon';

export default function ClassPicker() {
  const { currentUser, classes, enrollments, profileById, refresh } = useApp();
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [busy, setBusy] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      classes
        .filter((c) => subjectFilter === 'all' || c.subject === subjectFilter)
        .sort((a, b) => a.subject.localeCompare(b.subject) || a.name.localeCompare(b.name)),
    [classes, subjectFilter],
  );

  if (!currentUser) return <div className="empty">Select a user to begin.</div>;
  if (currentUser.role !== 'student') {
    return (
      <div className="empty">
        The class picker is for students. Switch to a student to choose classes.
      </div>
    );
  }

  const myClassIds = new Set(
    enrollments.filter((e) => e.student_id === currentUser.id).map((e) => e.class_id),
  );

  const toggle = async (classId: string) => {
    setBusy(classId);
    try {
      if (myClassIds.has(classId)) {
        await repo.unenroll(currentUser.id, classId);
      } else {
        await repo.enroll(currentUser.id, classId);
      }
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1>Pick your classes</h1>
        <p>
          Choose the classes you're taking for {SCHOOL_YEAR}. Your homework feed and
          calendar will show only these. You've selected <strong>{myClassIds.size}</strong>.
        </p>
      </div>

      <div className="toolbar">
        <div className="toggle-group">
          <button
            className={`toggle ${subjectFilter === 'all' ? 'on' : ''}`}
            onClick={() => setSubjectFilter('all')}
          >
            All subjects
          </button>
          {SUBJECTS.map((s) => (
            <button
              key={s}
              className={`toggle ${subjectFilter === s ? 'on' : ''}`}
              onClick={() => setSubjectFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid cols-2">
        {visible.map((c) => {
          const selected = myClassIds.has(c.id);
          const teacher = profileById(c.teacher_id);
          const color = subjectColor(c.subject);
          return (
            <div
              key={c.id}
              className={`card class-card${selected ? ' selected' : ''}`}
              style={{ borderLeft: `4px solid ${color}` }}
            >
              <div className="row-between">
                <div>
                  <h3 style={{ margin: 0 }}>{c.name}</h3>
                  <p className="sub" style={{ marginTop: 2 }}>
                    <span className="subject-chip">
                      <span className="legend-dot" style={{ background: color }} />
                      {c.subject}
                    </span>{' '}
                    {displayName(teacher)} · {c.period} · Room {c.room}
                  </p>
                </div>
                <button
                  className={`btn small ${selected ? 'secondary' : ''}`}
                  disabled={busy === c.id}
                  onClick={() => toggle(c.id)}
                >
                  {selected ? <><Icon name="check" size="0.9em" /> Selected</> : 'Add'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
