import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import * as repo from '../lib/repository';
import { displayName } from '../lib/names';
import { parseISO, today } from '../lib/dates';

/**
 * The student half of counselor scheduling. Previously only a counselor could
 * start a meeting, so a student who needed one still had to send an email and
 * hope — the same gap this app closes for homework.
 */
export default function RequestMeeting() {
  const {
    currentUser,
    profiles,
    meetingRequests,
    counselorSlots,
    profileById,
    refresh,
  } = useApp();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [preferred, setPreferred] = useState('');
  const [counselorId, setCounselorId] = useState('');
  const [slotId, setSlotId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const counselors = useMemo(
    () => profiles.filter((p) => p.role === 'counselor'),
    [profiles],
  );

  const chosenCounselor = counselorId || counselors[0]?.id;

  // Only times still open, and only ones that haven't already passed.
  const openSlots = useMemo(
    () =>
      counselorSlots
        .filter((s) => s.counselor_id === chosenCounselor && !s.booked_by && s.date >= today())
        .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time)),
    [counselorSlots, chosenCounselor],
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
    setError(null);
    const slot = openSlots.find((s) => s.id === slotId);
    try {
      if (slot) {
        // Picking a posted time books it outright. Asking a counselor to
        // re-approve a time they already published is the waiting this feature
        // exists to delete.
        await repo.bookCounselorSlot(slot.id, currentUser.id);
        await repo.createCalendarEvent({
          owner_id: currentUser.id,
          title: 'Counselor meeting',
          date: slot.date,
          category: 'counseling',
          note: [slot.start_time, slot.location, reason.trim()].filter(Boolean).join(' · '),
          created_by: chosenCounselor,
        });
        await repo.createMeetingRequest({
          student_id: currentUser.id,
          counselor_id: chosenCounselor,
          reason: reason.trim(),
          preferred: `${slot.date} · ${slot.start_time}`,
          status: 'accepted',
          response: `Booked for ${slot.date} · ${slot.start_time}`,
          slot_id: slot.id,
        });
      } else {
        await repo.createMeetingRequest({
          student_id: currentUser.id,
          counselor_id: chosenCounselor,
          reason: reason.trim(),
          preferred: preferred.trim() || null,
          status: 'pending',
          response: null,
          slot_id: null,
        });
      }
      setReason('');
      setPreferred('');
      setSlotId('');
      setOpen(false);
      await refresh();
    } catch (err) {
      // Almost always "someone took that time first" — reload so the list they
      // are looking at stops offering it.
      setError(err instanceof Error ? err.message : String(err));
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section">
      <div className="row-between mb-3">
        <h2 className="section-title">Counselor</h2>
        <button
          className={`btn small ${open ? 'secondary' : ''}`}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Cancel' : 'Request a meeting'}
        </button>
      </div>

      {open && (
        <div className="card mb-3">
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
          {openSlots.length > 0 ? (
            <div className="field">
              <label htmlFor="req-slot">Pick a time</label>
              <select id="req-slot" value={slotId} onChange={(e) => setSlotId(e.target.value)}>
                <option value="">Ask for a time instead…</option>
                {openSlots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {parseISO(s.date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    · {s.start_time}
                    {s.location ? ` · ${s.location}` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {!slotId && (
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
          )}

          {error && (
            <div className="banner error mb-3" role="alert">
              <span className="dot" />
              {error}
            </div>
          )}

          <div className="row-between">
            <span className="meta">
              {slotId
                ? "That time is yours as soon as you send — it goes straight on your calendar."
                : openSlots.length > 0
                  ? 'Or pick one of the open times above and skip the wait.'
                  : 'Your counselor sees this and books a time.'}
            </span>
            <button className="btn small" disabled={!reason.trim() || busy} onClick={send}>
              {busy ? (slotId ? 'Booking…' : 'Sending…') : slotId ? 'Book this time' : 'Send request'}
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
                <div className="meta mt-1">
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
