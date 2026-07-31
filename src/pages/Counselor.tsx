import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import * as repo from '../lib/repository';
import { today, parseISO } from '../lib/dates';
import { displayName } from '../lib/names';

/**
 * Counselor console: schedule counseling meetings straight onto a student's
 * calendar (instead of emailing dates around). The student sees it the moment
 * they open Homework Hub.
 */
export default function Counselor() {
  const { currentUser, profiles, calendarEvents, profileById, refresh } = useApp();
  const [studentId, setStudentId] = useState('');
  const [title, setTitle] = useState('Counselor check-in');
  const [date, setDate] = useState(today());
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const students = useMemo(
    () => profiles.filter((p) => p.role === 'student').sort((a, b) => a.name.localeCompare(b.name)),
    [profiles],
  );

  const myMeetings = useMemo(
    () =>
      calendarEvents
        .filter((e) => e.created_by === currentUser?.id)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [calendarEvents, currentUser],
  );

  if (!currentUser) return <div className="empty">Select a user to begin.</div>;
  if (currentUser.role !== 'counselor') {
    return <div className="empty">This page is for counselors. Switch to a counselor account to use it.</div>;
  }

  const schedule = async () => {
    if (!studentId || !title.trim() || !date) return;
    setBusy(true);
    try {
      const details = [time.trim(), location.trim(), note.trim()].filter(Boolean).join(' · ');
      await repo.createCalendarEvent({
        owner_id: studentId,
        title: title.trim(),
        date,
        category: 'counseling',
        note: details || null,
        created_by: currentUser.id,
      });
      await refresh();
      const who = displayName(profileById(studentId));
      setFlash(`Added to ${who}'s calendar ✓`);
      setNote('');
      setTime('');
      setLocation('');
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (id: string) => {
    await repo.deleteCalendarEvent(id);
    await refresh();
  };

  const upcoming = myMeetings.filter((m) => m.date >= today());
  const past = myMeetings.filter((m) => m.date < today());

  return (
    <div>
      <div className="page-head">
        <h1>Counselor</h1>
        <p>Schedule meetings straight onto a student's calendar — no email chains.</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem' }}>Schedule a meeting</h2>
        <div className="inline" style={{ gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div className="field" style={{ flex: '1 1 220px' }}>
            <label>Student</label>
            <select aria-label="Student" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Choose a student…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {displayName(s)} · G{s.grade}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ flex: '1 1 200px' }}>
            <label>Title</label>
            <input aria-label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
        </div>
        <div className="inline" style={{ gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div className="field" style={{ flex: '0 0 160px' }}>
            <label>Date</label>
            <input aria-label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field" style={{ flex: '0 0 130px' }}>
            <label>Time <span className="hint">(optional)</span></label>
            <input aria-label="Time" value={time} placeholder="11:15am" onChange={(e) => setTime(e.target.value)} />
          </div>
          <div className="field" style={{ flex: '0 0 150px' }}>
            <label>Location <span className="hint">(optional)</span></label>
            <input aria-label="Location" value={location} placeholder="Room 102" onChange={(e) => setLocation(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Note <span className="hint">(optional)</span></label>
          <input aria-label="Note" value={note} placeholder="e.g. College application timeline" onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="row-between">
          {flash ? <span className="meta">{flash}</span> : <span />}
          <button className="btn small" disabled={!studentId || !title.trim() || !date || busy} onClick={schedule}>
            {busy ? 'Adding…' : 'Add to student calendar'}
          </button>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">Upcoming meetings ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <div className="empty">No meetings scheduled yet.</div>
        ) : (
          <ul className="plain-list boxed">
            {upcoming.map((m) => (
              <li key={m.id} className="list-row">
                <div>
                  <strong>🧭 {displayName(profileById(m.owner_id))}</strong>
                  <div className="meta" style={{ marginTop: 2 }}>
                    {parseISO(m.date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {m.note ? ` · ${m.note}` : ''}
                  </div>
                </div>
                <button className="btn danger small" onClick={() => cancel(m.id)}>Cancel</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {past.length > 0 && (
        <div className="section">
          <h2 className="section-title">Past</h2>
          <ul className="plain-list boxed">
            {past.map((m) => (
              <li key={m.id} className="list-row">
                <span className="muted">
                  🧭 {displayName(profileById(m.owner_id))} ·{' '}
                  {parseISO(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                <button className="btn danger small" onClick={() => cancel(m.id)}>Remove</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
