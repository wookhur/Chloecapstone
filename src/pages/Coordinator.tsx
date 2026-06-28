import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { scorePair } from '../lib/matching';
import { computePoints } from '../lib/points';
import * as repo from '../lib/repository';
import type { Match, Profile, Session } from '../lib/types';

interface MatchRow {
  match: Match;
  mentor?: Profile;
  mentee?: Profile;
  sessions: Session[];
  avgSatisfaction: number | null;
  lastFit: Match['status'] | string | null;
  health: 'good' | 'okay' | 'poor' | 'none';
}

function buildRows(
  matches: Match[],
  sessions: Session[],
  profileById: (id: string) => Profile | undefined,
): MatchRow[] {
  return matches.map((match) => {
    const ms = sessions
      .filter((s) => s.match_id === match.id)
      .sort((a, b) => a.session_no - b.session_no);
    const rated = ms.filter((s) => s.satisfaction != null);
    const avgSatisfaction = rated.length
      ? Math.round((rated.reduce((t, s) => t + (s.satisfaction ?? 0), 0) / rated.length) * 10) / 10
      : null;
    const lastFit = ms[ms.length - 1]?.relationship_fit ?? null;
    let health: MatchRow['health'] = 'none';
    if (match.status === 'rematch') health = 'poor';
    else if (lastFit) health = lastFit;
    return {
      match,
      mentor: profileById(match.mentor_id),
      mentee: profileById(match.mentee_id),
      sessions: ms,
      avgSatisfaction,
      lastFit,
      health,
    };
  });
}

export default function Coordinator() {
  const { matches, sessions, profileById, profiles, refresh } = useApp();
  const [busy, setBusy] = useState<string | null>(null);

  const rows = useMemo(
    () => buildRows(matches, sessions, profileById),
    [matches, sessions, profileById],
  );

  const stats = useMemo(() => {
    const active = matches.filter((m) => m.status === 'active').length;
    const retained = matches.filter(
      (m) => sessions.filter((s) => s.match_id === m.id).length >= 4,
    ).length;
    const withSessions = matches.filter(
      (m) => sessions.some((s) => s.match_id === m.id),
    ).length;
    const flagged = rows.filter((r) => r.health === 'poor').length;
    const retentionRate = withSessions ? Math.round((retained / withSessions) * 100) : 0;
    return { active, retentionRate, flagged, total: matches.length };
  }, [matches, sessions, rows]);

  const flagged = rows.filter((r) => r.health === 'poor');

  const adjust = async (row: MatchRow, delta: number) => {
    if (!row.mentor || !row.mentee) return;
    const next = Math.max(-5, Math.min(5, row.match.coordinator_adjustment + delta));
    const rescored = scorePair(row.mentor, row.mentee, row.match.subject, next);
    setBusy(row.match.id);
    try {
      await repo.updateMatch(row.match.id, {
        coordinator_adjustment: next,
        score: rescored.score,
        score_breakdown: rescored.breakdown,
      });
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  const setStatus = async (id: string, status: Match['status']) => {
    setBusy(id);
    try {
      await repo.updateMatch(id, { status });
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  const exportReport = () => {
    const lines = ['Name,Role,Grade,Points,VolunteerHours,ActiveMatches'];
    for (const p of profiles.filter((x) => x.role !== 'coordinator')) {
      const pts = computePoints(p, matches, sessions);
      const activeCount = matches.filter(
        (m) =>
          m.status === 'active' &&
          (p.role === 'mentor' ? m.mentor_id === p.id : m.mentee_id === p.id),
      ).length;
      lines.push(
        [
          `"${p.name}"`,
          p.role,
          p.grade ?? '',
          pts.total,
          p.role === 'mentor' ? pts.volunteerHours : 0,
          activeCount,
        ].join(','),
      );
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yeon-school-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-head">
        <h1>Coordinator Dashboard</h1>
        <p>Every match, its relationship health, and the levers to keep it warm.</p>
      </div>

      <div className="stat-row section">
        <div className="stat"><div className="v">{stats.total}</div><div className="k">Total matches</div></div>
        <div className="stat"><div className="v accent">{stats.active}</div><div className="k">Active</div></div>
        <div className="stat"><div className="v brand">{stats.retentionRate}%</div><div className="k">4+ session retention</div></div>
        <div className="stat"><div className="v" style={{ color: stats.flagged ? 'var(--danger)' : undefined }}>{stats.flagged}</div><div className="k">Needs attention</div></div>
      </div>

      {flagged.length > 0 && (
        <div className="section">
          <h2>Needs attention</h2>
          <div className="stack">
            {flagged.map((row) => (
              <div className="card row-between" key={row.match.id}>
                <div>
                  <h3 style={{ marginBottom: 2 }}>
                    {row.mentor?.name} ↔ {row.mentee?.name}
                  </h3>
                  <p className="sub">
                    {row.match.subject} · last check-in flagged as not a great fit
                  </p>
                </div>
                <div className="inline">
                  <button
                    className="btn small accent"
                    disabled={busy === row.match.id}
                    onClick={() => setStatus(row.match.id, 'active')}
                  >
                    Keep & support
                  </button>
                  <button
                    className="btn small danger"
                    disabled={busy === row.match.id}
                    onClick={() => setStatus(row.match.id, 'ended')}
                  >
                    Re-match (end)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <div className="row-between">
          <h2>All matches</h2>
          <button className="btn secondary small" onClick={exportReport}>
            ⬇ Export school report (CSV)
          </button>
        </div>
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Health</th>
                <th>Mentor</th>
                <th>Mentee</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Sessions</th>
                <th>Avg ★</th>
                <th>Score</th>
                <th>Coordinator nudge</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.match.id}>
                  <td><span className={`health-dot ${row.health}`} /></td>
                  <td>{row.mentor?.name ?? '—'}</td>
                  <td>
                    {row.mentee?.name ?? '—'}
                    {row.mentee?.is_new_student && (
                      <span className="chip" style={{ marginLeft: 6 }}>new</span>
                    )}
                  </td>
                  <td>{row.match.subject}</td>
                  <td><span className={`pill ${row.match.status}`}>{row.match.status}</span></td>
                  <td>{row.sessions.length}</td>
                  <td>{row.avgSatisfaction ?? '—'}</td>
                  <td><strong>{row.match.score}</strong></td>
                  <td>
                    <div className="inline" style={{ gap: '0.3rem' }}>
                      <button
                        className="btn ghost small"
                        disabled={busy === row.match.id}
                        onClick={() => adjust(row, -1)}
                      >−</button>
                      <span style={{ minWidth: 28, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                        {row.match.coordinator_adjustment > 0 ? '+' : ''}
                        {row.match.coordinator_adjustment}
                      </span>
                      <button
                        className="btn ghost small"
                        disabled={busy === row.match.id}
                        onClick={() => adjust(row, 1)}
                      >+</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ fontSize: '0.8rem', marginTop: '0.6rem' }}>
          The nudge adjusts the coordinator weight (±5) in the matching score —
          your human judgment, made part of the algorithm.
        </p>
      </div>
    </div>
  );
}
