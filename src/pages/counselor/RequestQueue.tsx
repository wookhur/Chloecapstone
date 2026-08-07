import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import * as repo from '../../lib/repository';
import { displayName } from '../../lib/names';
import { today } from '../../lib/dates';
import type { MeetingRequest } from '../../lib/types';
import EmptyState from '../../components/EmptyState';

/**
 * Requests students have sent, and the two things a counselor can do with one:
 * book it (which writes the meeting straight onto that student's calendar) or
 * decline with a short note so the student isn't left waiting.
 */
export default function RequestQueue({ counselorId }: { counselorId: string }) {
  const { meetingRequests, profileById, refresh } = useApp();
  const [answering, setAnswering] = useState<MeetingRequest | null>(null);

  const pending = useMemo(
    () =>
      meetingRequests
        .filter((r) => r.status === 'pending')
        .filter((r) => !r.counselor_id || r.counselor_id === counselorId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [meetingRequests, counselorId],
  );

  return (
    <div className="section">
      <h2 className="section-title">Requests from students ({pending.length})</h2>

      {pending.length === 0 ? (
        <EmptyState icon="mail" title="No open requests">
          <p>Students who ask for a meeting appear here until you schedule them.</p>
        </EmptyState>
      ) : (
        <ul className="plain-list boxed">
          {pending.map((r) => (
            <li key={r.id} className="list-row">
              <div>
                <strong>{displayName(profileById(r.student_id))}</strong>
                <div className="meta mt-1">{r.reason}</div>
                {r.preferred && <div className="meta">Prefers: {r.preferred}</div>}
              </div>
              <button className="btn small" onClick={() => setAnswering(r)}>
                Respond
              </button>
            </li>
          ))}
        </ul>
      )}

      {answering && (
        <RespondForm
          key={answering.id}
          request={answering}
          counselorId={counselorId}
          onDone={async () => {
            setAnswering(null);
            await refresh();
          }}
          onCancel={() => setAnswering(null)}
        />
      )}
    </div>
  );
}

function RespondForm({
  request,
  counselorId,
  onDone,
  onCancel,
}: {
  request: MeetingRequest;
  counselorId: string;
  onDone: () => Promise<void>;
  onCancel: () => void;
}) {
  const { profileById } = useApp();
  const [date, setDate] = useState(today());
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const student = displayName(profileById(request.student_id));

  const accept = async () => {
    setBusy(true);
    try {
      // Booking is the whole point: the meeting lands on the student's calendar
      // rather than in an email they may not read.
      const details = [time.trim(), location.trim(), request.reason].filter(Boolean).join(' · ');
      await repo.createCalendarEvent({
        owner_id: request.student_id,
        title: 'Counselor meeting',
        date,
        category: 'counseling',
        note: details || null,
        created_by: counselorId,
      });
      await repo.updateMeetingRequest(request.id, {
        status: 'accepted',
        counselor_id: counselorId,
        response: `Booked for ${date}`,
      });
      await onDone();
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    setBusy(true);
    try {
      await repo.updateMeetingRequest(request.id, {
        status: 'declined',
        counselor_id: counselorId,
        response: note.trim() || 'Not available — please ask again.',
      });
      await onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card mt-3">
      <h3 className="mb-2">Respond to {student}</h3>
      <p className="meta mb-3">
        “{request.reason}”{request.preferred ? ` — prefers ${request.preferred}` : ''}
      </p>

      <div className="inline form-row">
        <div className="field w-date">
          <label htmlFor="resp-date">Date</label>
          <input id="resp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field w-short">
          <label htmlFor="resp-time">Time <span className="hint">(optional)</span></label>
          <input id="resp-time" value={time} placeholder="11:15am" onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="field w-mid">
          <label htmlFor="resp-loc">Location <span className="hint">(optional)</span></label>
          <input id="resp-loc" value={location} placeholder="Room 102" onChange={(e) => setLocation(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="resp-note">If declining, why? <span className="hint">(optional)</span></label>
        <input
          id="resp-note"
          value={note}
          placeholder="e.g. Out this week — try next Monday"
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="row-between">
        <button className="btn secondary small" onClick={onCancel}>Close</button>
        <div className="inline gap-1">
          <button className="btn secondary small" disabled={busy} onClick={decline}>
            Decline
          </button>
          <button className="btn small" disabled={busy} onClick={accept}>
            {busy ? 'Booking…' : 'Book it'}
          </button>
        </div>
      </div>
    </div>
  );
}
