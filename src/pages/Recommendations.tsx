import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import RecommendationCard from '../components/RecommendationCard';
import {
  recommendMenteesFor,
  recommendMentorsFor,
  scorePair,
  type Recommendation,
} from '../lib/matching';
import * as repo from '../lib/repository';
import type { Match, Profile } from '../lib/types';

export default function Recommendations() {
  const { currentUser } = useApp();
  if (!currentUser) return <div className="empty">Select a user to begin.</div>;
  if (currentUser.role === 'coordinator') return <CoordinatorMatchmaking />;
  if (currentUser.role === 'mentee') return <MenteeView mentee={currentUser} />;
  return <MentorView mentor={currentUser} />;
}

/* --- Mentee: recommended mentors ------------------------------------------*/
function MenteeView({ mentee }: { mentee: Profile }) {
  const { profiles, matches, refresh } = useApp();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const mentors = useMemo(() => profiles.filter((p) => p.role === 'mentor'), [profiles]);
  const recs = useMemo(() => recommendMentorsFor(mentee, mentors), [mentee, mentors]);

  const existingKey = (m: Match) => `${m.mentor_id}|${m.subject}`;
  const existing = new Set(
    matches.filter((m) => m.mentee_id === mentee.id).map(existingKey),
  );

  const request = async (rec: Recommendation) => {
    const key = `${rec.mentor.id}|${rec.subject}`;
    setBusyKey(key);
    try {
      await repo.createMatch({
        mentor_id: rec.mentor.id,
        mentee_id: mentee.id,
        subject: rec.subject,
        status: 'requested',
        requested_by: 'mentee',
        score: rec.score,
        score_breakdown: rec.breakdown,
        coordinator_adjustment: 0,
        coordinator_note: null,
      });
      await refresh();
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1>Matches for you</h1>
        <p>
          Ranked by subject fit <em>and</em> how well you'd get along. The
          coordinator reviews every request before it's final.
        </p>
      </div>
      {recs.length === 0 ? (
        <div className="empty">
          No mentors match your subjects yet. Add a subject you need help with in your Profile.
        </div>
      ) : (
        <div className="grid cols-2">
          {recs.map((rec) => {
            const key = `${rec.mentor.id}|${rec.subject}`;
            const already = existing.has(key);
            return (
              <RecommendationCard
                key={key}
                rec={rec}
                perspective="mentee"
                actionLabel={already ? 'Requested ✓' : 'Request mentor'}
                disabled={already || busyKey === key}
                onAction={() => request(rec)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* --- Mentor: incoming requests + suggested mentees ------------------------*/
function MentorView({ mentor }: { mentor: Profile }) {
  const { profiles, matches, refresh, profileById } = useApp();
  const [busy, setBusy] = useState<string | null>(null);

  const incoming = matches.filter(
    (m) => m.mentor_id === mentor.id && m.status === 'requested',
  );

  const mentees = useMemo(() => profiles.filter((p) => p.role === 'mentee'), [profiles]);
  const suggestions = useMemo(() => recommendMenteesFor(mentor, mentees), [mentor, mentees]);

  const connected = new Set(
    matches.filter((m) => m.mentor_id === mentor.id).map((m) => `${m.mentee_id}|${m.subject}`),
  );

  const accept = async (matchId: string) => {
    setBusy(matchId);
    try {
      await repo.updateMatch(matchId, { status: 'active', requested_by: null });
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  const invite = async (rec: Recommendation) => {
    const key = `${rec.mentee.id}|${rec.subject}`;
    setBusy(key);
    try {
      await repo.createMatch({
        mentor_id: mentor.id,
        mentee_id: rec.mentee.id,
        subject: rec.subject,
        status: 'requested',
        requested_by: 'mentor',
        score: rec.score,
        score_breakdown: rec.breakdown,
        coordinator_adjustment: 0,
        coordinator_note: null,
      });
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1>Matches for you</h1>
        <p>Mentees who'd be a good fit for your strengths — plus anyone who's asked for you.</p>
      </div>

      {incoming.length > 0 && (
        <div className="section">
          <h2>Requests waiting for you</h2>
          <div className="grid cols-2">
            {incoming.map((m) => {
              const mentee = profileById(m.mentee_id);
              if (!mentee) return null;
              const rec = scorePair(mentor, mentee, m.subject, m.coordinator_adjustment);
              return (
                <RecommendationCard
                  key={m.id}
                  rec={rec}
                  perspective="mentor"
                  actionLabel="Accept"
                  disabled={busy === m.id}
                  onAction={() => accept(m.id)}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className="section">
        <h2>Suggested mentees</h2>
        {suggestions.length === 0 ? (
          <div className="empty">No mentees need your subjects right now.</div>
        ) : (
          <div className="grid cols-2">
            {suggestions.map((rec) => {
              const key = `${rec.mentee.id}|${rec.subject}`;
              const already = connected.has(key);
              return (
                <RecommendationCard
                  key={key}
                  rec={rec}
                  perspective="mentor"
                  actionLabel={already ? 'Connected ✓' : 'Invite to connect'}
                  disabled={already || busy === key}
                  onAction={() => invite(rec)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Coordinator: matchmaking across the whole pilot ----------------------*/
function CoordinatorMatchmaking() {
  const { profiles, matches, refresh } = useApp();
  const mentees = useMemo(() => profiles.filter((p) => p.role === 'mentee'), [profiles]);
  const mentors = useMemo(() => profiles.filter((p) => p.role === 'mentor'), [profiles]);
  const [selectedId, setSelectedId] = useState<string>(mentees[0]?.id ?? '');
  const [busy, setBusy] = useState<string | null>(null);

  const selected = mentees.find((m) => m.id === selectedId);
  const recs = useMemo(
    () => (selected ? recommendMentorsFor(selected, mentors) : []),
    [selected, mentors],
  );

  const existing = new Set(
    matches
      .filter((m) => m.mentee_id === selectedId)
      .map((m) => `${m.mentor_id}|${m.subject}`),
  );

  const connect = async (rec: Recommendation) => {
    if (!selected) return;
    const key = `${rec.mentor.id}|${rec.subject}`;
    setBusy(key);
    try {
      await repo.createMatch({
        mentor_id: rec.mentor.id,
        mentee_id: selected.id,
        subject: rec.subject,
        status: 'active',
        requested_by: 'coordinator',
        score: rec.score,
        score_breakdown: rec.breakdown,
        coordinator_adjustment: 0,
        coordinator_note: 'Connected by coordinator.',
      });
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1>Matchmaking</h1>
        <p>Pick a mentee, review the ranked candidates, and make the human call.</p>
      </div>

      <div className="field" style={{ maxWidth: 360 }}>
        <label>Mentee</label>
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          {mentees.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} · G{m.grade}{m.is_new_student ? ' · new' : ''}
            </option>
          ))}
        </select>
      </div>

      {recs.length === 0 ? (
        <div className="empty">No candidate mentors for this mentee's subjects.</div>
      ) : (
        <div className="grid cols-2">
          {recs.map((rec) => {
            const key = `${rec.mentor.id}|${rec.subject}`;
            const already = existing.has(key);
            return (
              <RecommendationCard
                key={key}
                rec={rec}
                perspective="coordinator"
                actionLabel={already ? 'Connected ✓' : 'Connect now'}
                disabled={already || busy === key}
                onAction={() => connect(rec)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
