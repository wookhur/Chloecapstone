import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import * as repo from '../lib/repository';
import { today } from '../lib/dates';
import { buildDigest } from '../lib/digest';

/**
 * Preview of the Sunday email, plus the switch to stop getting it.
 *
 * The preview matters more than it looks: the email is sent by a scheduled
 * server job nobody can see running, so this is the only way a student — or a
 * teacher being pitched the app — can tell what actually arrives. It calls the
 * same buildDigest() the Edge Function does, so the two can't drift.
 */
export default function WeeklyDigest() {
  const { currentUser, assignments, enrollments, completions, calendarEvents, classes, refresh } =
    useApp();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const digest = useMemo(() => {
    if (!currentUser) return null;
    const myClassIds = new Set(
      enrollments.filter((e) => e.student_id === currentUser.id).map((e) => e.class_id),
    );
    return buildDigest({
      studentName: currentUser.name,
      assignments: assignments.filter((a) => myClassIds.has(a.class_id)),
      doneIds: completions
        .filter((c) => c.student_id === currentUser.id)
        .map((c) => c.assignment_id),
      classNames: Object.fromEntries(classes.map((c) => [c.id, c.name])),
      events: calendarEvents.filter((e) => e.owner_id === currentUser.id),
      weekStart: today(),
    });
  }, [currentUser, assignments, enrollments, completions, calendarEvents, classes]);

  if (!currentUser || currentUser.role !== 'student' || !digest) return null;

  const toggleOptIn = async () => {
    setBusy(true);
    try {
      await repo.updateProfile(currentUser.id, { wants_digest: !currentUser.wants_digest });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section">
      <div className="row-between" style={{ marginBottom: '0.6rem' }}>
        <h2 className="section-title">Weekly email</h2>
        <button
          className={`btn small ${open ? 'secondary' : ''}`}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Hide' : 'Preview'}
        </button>
      </div>

      <p className="meta" style={{ marginTop: 0 }}>
        {currentUser.wants_digest
          ? 'Every Sunday evening you get one email with the week ahead — so a deadline can reach you without you opening anything.'
          : "You're not getting the Sunday email."}{' '}
        <button className="linklike" disabled={busy} onClick={toggleOptIn}>
          {currentUser.wants_digest ? 'Turn it off' : 'Turn it back on'}
        </button>
      </p>

      {open && (
        <div className="card digest-preview">
          <div className="digest-subject">
            <span className="meta">Subject</span>
            <strong>{digest.subject}</strong>
          </div>
          <p style={{ marginBottom: digest.empty ? 0 : '0.75rem' }}>{digest.greeting}</p>
          {digest.days.map((d) => (
            <div key={d.date} style={{ marginBottom: '0.6rem' }}>
              <strong>{d.label}</strong>
              <ul className="plain-list" style={{ marginTop: '0.2rem' }}>
                {d.items.map((item, i) => (
                  <li key={`${d.date}-${i}`}>
                    {item.emphasis ? <strong>{item.title}</strong> : item.title}{' '}
                    <span className="meta">— {item.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="meta" style={{ margin: 0 }}>
            Due dates only. Grades live in the school system.
          </p>
        </div>
      )}
    </section>
  );
}
