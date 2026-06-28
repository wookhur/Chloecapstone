import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { computePoints, POINTS } from '../lib/points';
import type { Match, Profile, Session } from '../lib/types';

interface Badge {
  emoji: string;
  label: string;
  earned: boolean;
}

function badgesFor(
  person: Profile,
  matches: Match[],
  sessions: Session[],
  total: number,
): Badge[] {
  const mySessions = sessions.filter((s) =>
    matches.some(
      (m) =>
        m.id === s.match_id &&
        (person.role === 'mentor' ? m.mentor_id === person.id : m.mentee_id === person.id),
    ),
  );
  const maxPerMatch = Math.max(
    0,
    ...matches.map(
      (m) => mySessions.filter((s) => s.match_id === m.id).length,
    ),
  );
  const grewSomeone = mySessions.some((s) => s.mentee_growth);

  return [
    { emoji: '🌱', label: 'First session', earned: mySessions.length >= 1 },
    { emoji: '🔥', label: 'Four-session streak', earned: maxPerMatch >= 4 },
    { emoji: '💯', label: 'Century club (100P)', earned: total >= 100 },
    person.role === 'mentor'
      ? { emoji: '🚀', label: 'Growth maker', earned: grewSomeone }
      : { emoji: '📈', label: 'Steady learner', earned: mySessions.length >= 3 },
  ];
}

export default function Points() {
  const { currentUser, matches, sessions, profiles } = useApp();
  if (!currentUser) return <div className="empty">Select a user to begin.</div>;

  if (currentUser.role === 'coordinator') {
    return <Leaderboard profiles={profiles} matches={matches} sessions={sessions} />;
  }

  const summary = computePoints(currentUser, matches, sessions);
  const badges = badgesFor(currentUser, matches, sessions, summary.total);
  const isMentor = currentUser.role === 'mentor';

  return (
    <div>
      <div className="page-head">
        <h1>Points & Volunteer Hours</h1>
        <p>
          {isMentor
            ? 'Your contribution, recognized — points convert to verified volunteer hours.'
            : 'Points for showing up and keeping your commitments.'}
        </p>
      </div>

      <div className="stat-row section">
        <div className="stat">
          <div className="v brand">{summary.total}</div>
          <div className="k">Total points</div>
        </div>
        {isMentor && (
          <div className="stat">
            <div className="v accent">{summary.volunteerHours}h</div>
            <div className="k">Volunteer hours</div>
          </div>
        )}
        <div className="stat">
          <div className="v">{badges.filter((b) => b.earned).length}</div>
          <div className="k">Badges earned</div>
        </div>
      </div>

      <div className="section">
        <h2>Badges</h2>
        <div className="grid cols-3">
          {badges.map((b) => (
            <div
              className="card"
              key={b.label}
              style={{ opacity: b.earned ? 1 : 0.45, textAlign: 'center' }}
            >
              <div className="badge-emoji" style={{ fontSize: '1.8rem' }}>{b.emoji}</div>
              <h3 style={{ fontSize: '0.95rem', marginTop: '0.4rem' }}>{b.label}</h3>
              <p className="sub">{b.earned ? 'Earned' : 'Locked'}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>How points are earned</h2>
        <div className="card">
          <ul className="ledger">
            {summary.ledger.length === 0 ? (
              <li><span className="desc muted">No activity yet — log a session to start earning.</span></li>
            ) : (
              summary.ledger.map((row, i) => (
                <li key={i}>
                  <span className="desc">
                    {row.label}
                    {row.detail && <small>{row.detail}</small>}
                  </span>
                  <span className="pts">+{row.points}P</span>
                </li>
              ))
            )}
          </ul>
        </div>
        <p className="muted" style={{ fontSize: '0.8rem', marginTop: '0.6rem' }}>
          Rules: mentor session +{POINTS.mentorSession}P · 4+ sessions +{POINTS.mentorRetentionBonus}P ·
          mentee growth +{POINTS.mentorGrowthBonus}P · mentee session +{POINTS.menteeSession}P ·
          attendance streak +{POINTS.menteeStreakBonus}P. Hours are verified by the coordinator & advisor.
        </p>
      </div>
    </div>
  );
}

/* Coordinator sees the whole cohort's contribution ------------------------ */
function Leaderboard({
  profiles,
  matches,
  sessions,
}: {
  profiles: Profile[];
  matches: Match[];
  sessions: Session[];
}) {
  const rows = useMemo(() => {
    return profiles
      .filter((p) => p.role !== 'coordinator')
      .map((p) => ({ profile: p, ...computePoints(p, matches, sessions) }))
      .sort((a, b) => b.total - a.total);
  }, [profiles, matches, sessions]);

  const totalHours = rows.reduce((h, r) => h + r.volunteerHours, 0);

  return (
    <div>
      <div className="page-head">
        <h1>Contribution overview</h1>
        <p>Every participant's points and accrued volunteer hours.</p>
      </div>
      <div className="stat-row section">
        <div className="stat">
          <div className="v accent">{Math.round(totalHours * 10) / 10}h</div>
          <div className="k">Total volunteer hours</div>
        </div>
        <div className="stat">
          <div className="v">{rows.reduce((s, r) => s + r.total, 0)}</div>
          <div className="k">Total points awarded</div>
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Role</th><th>Points</th><th>Hours</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.profile.id}>
                <td>{r.profile.name}</td>
                <td className="muted" style={{ textTransform: 'capitalize' }}>{r.profile.role}</td>
                <td>{r.total}</td>
                <td>{r.profile.role === 'mentor' ? `${r.volunteerHours}h` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
