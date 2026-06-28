import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import * as repo from '../lib/repository';
import type { Match, Profile, RelationshipFit, Session } from '../lib/types';

export default function MyMentoring() {
  const { currentUser, matches } = useApp();

  if (!currentUser) return <div className="empty">Select a user to begin.</div>;
  if (currentUser.role === 'coordinator') {
    return (
      <div className="empty">
        Coordinators manage every relationship from the <strong>Coordinator</strong> tab.
      </div>
    );
  }

  const mine = matches.filter((m) =>
    currentUser.role === 'mentor'
      ? m.mentor_id === currentUser.id
      : m.mentee_id === currentUser.id,
  );

  const active = mine.filter((m) => m.status === 'active');
  const pending = mine.filter((m) => m.status === 'requested');

  return (
    <div>
      <div className="page-head">
        <h1>My Mentoring</h1>
        <p>Your connections, session history, and relationship check-ins.</p>
      </div>

      {pending.length > 0 && (
        <div className="section">
          <h2>Pending</h2>
          <div className="stack">
            {pending.map((m) => (
              <PendingRow key={m.id} match={m} viewer={currentUser} />
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <h2>Active connections</h2>
        {active.length === 0 ? (
          <div className="empty">
            No active connections yet. Find a match from the “Matches for me” tab.
          </div>
        ) : (
          <div className="stack">
            {active.map((m) => (
              <ConnectionCard key={m.id} match={m} viewer={currentUser} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PendingRow({ match, viewer }: { match: Match; viewer: Profile }) {
  const { profileById, refresh } = useApp();
  const other = profileById(viewer.role === 'mentor' ? match.mentee_id : match.mentor_id);
  const waitingOnMe =
    (viewer.role === 'mentor' && match.requested_by === 'mentee') ||
    (viewer.role === 'mentee' && match.requested_by === 'mentor');
  const [busy, setBusy] = useState(false);

  const accept = async () => {
    setBusy(true);
    try {
      await repo.updateMatch(match.id, { status: 'active', requested_by: null });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card row-between">
      <div>
        <h3 style={{ marginBottom: 2 }}>{other?.name}</h3>
        <p className="sub">
          {match.subject} · <span className="pill requested">requested</span>
        </p>
      </div>
      {waitingOnMe ? (
        <button className="btn small" onClick={accept} disabled={busy}>
          Accept
        </button>
      ) : (
        <span className="muted" style={{ fontSize: '0.82rem' }}>Waiting for {other?.name}</span>
      )}
    </div>
  );
}

function ConnectionCard({ match, viewer }: { match: Match; viewer: Profile }) {
  const { profileById, sessions, refresh } = useApp();
  const other = profileById(viewer.role === 'mentor' ? match.mentee_id : match.mentor_id);

  const matchSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.match_id === match.id)
        .sort((a, b) => a.session_no - b.session_no),
    [sessions, match.id],
  );

  const lastFit = matchSessions[matchSessions.length - 1]?.relationship_fit ?? null;

  return (
    <div className="card">
      <div className="row-between">
        <div>
          <h3 style={{ marginBottom: 2 }}>{other?.name}</h3>
          <p className="sub">
            {match.subject} · Grade {other?.grade} ·{' '}
            <span className="pill active">active</span>
          </p>
        </div>
        <div className="inline">
          <span className={`health-dot ${lastFit ?? 'none'}`} />
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            {matchSessions.length} session{matchSessions.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {matchSessions.length > 0 && (
        <>
          <div className="divider" />
          <table className="table">
            <thead>
              <tr>
                <th>#</th><th>Date</th><th>Topic</th><th>Rating</th><th>Fit</th>
              </tr>
            </thead>
            <tbody>
              {matchSessions.map((s) => (
                <tr key={s.id}>
                  <td>{s.session_no}</td>
                  <td>{s.date}</td>
                  <td>{s.topic ?? '—'}</td>
                  <td>{s.satisfaction ? '★'.repeat(s.satisfaction) : '—'}</td>
                  <td>
                    {s.relationship_fit ? (
                      <span className={`pill ${s.relationship_fit}`}>{s.relationship_fit}</span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div className="divider" />
      <LogSessionForm
        match={match}
        viewer={viewer}
        nextNo={matchSessions.length + 1}
        onLogged={refresh}
      />
    </div>
  );
}

function LogSessionForm({
  match,
  viewer,
  nextNo,
  onLogged,
}: {
  match: Match;
  viewer: Profile;
  nextNo: number;
  onLogged: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState(60);
  const [satisfaction, setSatisfaction] = useState(5);
  const [fit, setFit] = useState<RelationshipFit>('good');
  const [growth, setGrowth] = useState(false);
  const [busy, setBusy] = useState(false);

  const isMentor = viewer.role === 'mentor';

  const submit = async () => {
    setBusy(true);
    try {
      const session: Omit<Session, 'id' | 'created_at'> = {
        match_id: match.id,
        session_no: nextNo,
        date: new Date().toISOString().slice(0, 10),
        topic: topic.trim() || null,
        duration_min: duration,
        satisfaction,
        relationship_fit: fit,
        mentee_growth: isMentor ? growth : false,
        notes: null,
      };
      await repo.createSession(session);
      // A "poor" check-in flips the match into rematch so the coordinator sees it.
      if (fit === 'poor') {
        await repo.updateMatch(match.id, { status: 'rematch' });
      }
      await onLogged();
      setOpen(false);
      setTopic('');
      setGrowth(false);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button className="btn secondary small" onClick={() => setOpen(true)}>
        + Log session #{nextNo} & check in
      </button>
    );
  }

  return (
    <div>
      <div className="inline" style={{ gap: '1rem', alignItems: 'flex-start' }}>
        <div className="field" style={{ flex: 1, marginBottom: '0.6rem' }}>
          <label>Topic</label>
          <input
            type="text"
            value={topic}
            placeholder="What did you work on?"
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>
        <div className="field" style={{ flex: '0 0 130px', marginBottom: '0.6rem' }}>
          <label>Minutes</label>
          <input
            type="number"
            min={15}
            step={15}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="field" style={{ marginBottom: '0.6rem' }}>
        <label>Session rating</label>
        <div className="toggle-group">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`toggle ${satisfaction === n ? 'on' : ''}`}
              onClick={() => setSatisfaction(n)}
            >
              {'★'.repeat(n)}
            </button>
          ))}
        </div>
      </div>

      <div className="field" style={{ marginBottom: '0.6rem' }}>
        <label>How's the fit? <span className="hint">— the relationship check-in</span></label>
        <div className="toggle-group">
          {(['good', 'okay', 'poor'] as RelationshipFit[]).map((f) => (
            <button
              key={f}
              type="button"
              className={`toggle ${fit === f ? 'on accent' : ''}`}
              onClick={() => setFit(f)}
            >
              {f === 'good' ? '😊 good' : f === 'okay' ? '😐 okay' : '😕 not great'}
            </button>
          ))}
        </div>
        {fit === 'poor' && (
          <p className="muted" style={{ fontSize: '0.78rem', marginTop: '0.4rem' }}>
            This flags the match for the coordinator to gently re-match.
          </p>
        )}
      </div>

      {isMentor && (
        <div className="field" style={{ marginBottom: '0.6rem' }}>
          <label>Mentee growth this session?</label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle ${growth ? 'on accent' : ''}`}
              onClick={() => setGrowth(!growth)}
            >
              {growth ? '✓ confidence / grade improved' : 'Mark growth (+bonus)'}
            </button>
          </div>
        </div>
      )}

      <div className="row-between" style={{ marginTop: '0.5rem' }}>
        <button className="btn ghost small" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn small" onClick={submit} disabled={busy}>
          {busy ? 'Saving…' : 'Save session'}
        </button>
      </div>
    </div>
  );
}
