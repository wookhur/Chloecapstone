import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import * as repo from '../lib/repository';
import { displayName } from '../lib/names';
import { parseISO } from '../lib/dates';

/**
 * The student half of counselor scheduling. Previously only a counselor could
 * start a meeting, so a student who needed one still had to send an email and
 * hope — the same gap this app closes for homework.
 */
export default function RequestMeeting() {
  const { currentUser, profiles, meetingRequests, profileById, refresh } = useApp();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [preferred, setPreferred] = useState('');
  const [counselorId, setCounselorId] = useState('');
  const [busy, setBusy] = useState(false);

  const counselors = useMemo(
    () => profiles.filter((p) => p.role === 'counselor'),
    [profiles],
  );

  const mine = useMemo(
    () =>
      meetingRequests
        .filter((r) => r.student_id === currentUser?.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [meetingRequests, currentUser],
  );

  if (currentUser?.role !== 'student' || counselors.length === 0) return null;

  const send = async () => {
    if (!reason.trim()) return;
    setBusy(true);
    try {
      await repo.createMeetingRequest({
        student_id: currentUser.id,
        counselor_id: counselorId || counselors[0].id,
        reason: reason.trim(),
        preferred: preferred.trim() || null,
        status: 'pending',
        response: null,
      });
      setReason('');
      setPreferred('');
      setOpen(false);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section">
      <div className="row-between" style={{ marginBottom: '0.6rem' }}>
        <h2 className="section-title">🧭 Counselor</h2>
        <button
          className={`btn small ${open ? 'secondary' : ''}`}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Cancel' : 'Request a meeting'}
        </button>
      </div>

      {open && (
        <div className="card" style={{ marginBottom: '0.75rem' }}>
          {counselors.length > 1 && (
            <div className="field">
              <label htmlFor="req-counselor">Counselor</label>
              <select
                id="req-counselor"
                value={counselorId}
                onChange={(e) => setCounselorId(e.target.value)}
              >
                {counselors.map((c) => (
                  <option key={c.id} value={c.id}>{displayName(c)}</option>
                ))}
              </select>
            </div>
          )}
          <div className="field">
            <label htmlFor="req-reason">What would you like to talk about?</label>
            <textarea
              id="req-reason"
              value={reason}
              placeholder="e.g. Choosing classes for next year"
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="req-when">
              When suits you? <span className="hint">(optional)</span>
            </label>
            <input
              id="req-when"
              value={preferred}
              placeholder="e.g. Any lunch period this week"
              onChange={(e) => setPreferred(e.target.value)}
            />
          </div>
          <div className="row-between">
            <span className="meta">Your counselor sees this and books a time.</span>
            <button className="btn small" disabled={!reason.trim() || busy} onClick={send}>
              {busy ? 'Sending…' : 'Send request'}
            </button>
          </div>
        </div>
      )}

      {mine.length === 0 ? (
        <p className="meta">
          Need to talk to a counselor? Ask here instead of emailing — you'll see the
          meeting land on your calendar.
        </p>
      ) : (
        <ul className="plain-list boxed">
          {mine.map((r) => (
            <li key={r.id} className="list-row">
              <div>
                <strong>{r.reason}</strong>
                <div className="meta" style={{ marginTop: 2 }}>
                  {displayName(profileById(r.counselor_id ?? ''))} ·{' '}
                  {parseISO(r.created_at.slice(0, 10)).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                  {r.response ? ` · ${r.response}` : ''}
                </div>
              </div>
              <span className={`chip request-${r.status}`}>
                {r.status === 'pending' ? 'Waiting' : r.status === 'accepted' ? 'Booked' : 'Declined'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
