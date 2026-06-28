import type { Match, Profile, Session } from './types';

/**
 * Points & volunteer-hour rules (from the proposal's incentive model).
 *
 * Mentor:
 *   - complete a session ............................ +10P
 *   - reach 4+ sessions with the same mentee ........ +20P (one-time bonus)
 *   - mentee growth flagged (confidence / grade) .... +15P (per flagged session)
 * Mentee:
 *   - attend a session / keep the appointment ....... +5P
 *   - 3+ consecutive sessions (attendance streak) ... +10P (one-time bonus)
 *
 * Volunteer hours accrue for mentors only: sum of session durations.
 */
export const POINTS = {
  mentorSession: 10,
  mentorRetentionBonus: 20,
  mentorGrowthBonus: 15,
  menteeSession: 5,
  menteeStreakBonus: 10,
  retentionThreshold: 4,
  streakThreshold: 3,
} as const;

export interface PointsLedgerRow {
  label: string;
  points: number;
  detail?: string;
}

export interface PointsSummary {
  total: number;
  volunteerHours: number;
  ledger: PointsLedgerRow[];
}

/**
 * Compute a person's points + volunteer hours from all sessions on the matches
 * they belong to. `role` decides which side's rules apply.
 */
export function computePoints(
  person: Profile,
  matches: Match[],
  sessions: Session[],
): PointsSummary {
  const myMatches = matches.filter((m) =>
    person.role === 'mentor' ? m.mentor_id === person.id : m.mentee_id === person.id,
  );

  const ledger: PointsLedgerRow[] = [];
  let total = 0;
  let volunteerHours = 0;

  for (const match of myMatches) {
    const matchSessions = sessions
      .filter((s) => s.match_id === match.id)
      .sort((a, b) => a.session_no - b.session_no);

    if (matchSessions.length === 0) continue;

    if (person.role === 'mentor') {
      const sessionPoints = matchSessions.length * POINTS.mentorSession;
      total += sessionPoints;
      ledger.push({
        label: `${matchSessions.length} session${matchSessions.length > 1 ? 's' : ''} completed`,
        points: sessionPoints,
        detail: `${match.subject} mentoring`,
      });

      if (matchSessions.length >= POINTS.retentionThreshold) {
        total += POINTS.mentorRetentionBonus;
        ledger.push({
          label: 'Retention bonus (4+ sessions, same mentee)',
          points: POINTS.mentorRetentionBonus,
          detail: match.subject,
        });
      }

      const growthCount = matchSessions.filter((s) => s.mentee_growth).length;
      if (growthCount > 0) {
        const growthPoints = growthCount * POINTS.mentorGrowthBonus;
        total += growthPoints;
        ledger.push({
          label: `Mentee growth bonus ×${growthCount}`,
          points: growthPoints,
          detail: 'Confidence / grade improvement',
        });
      }

      volunteerHours += matchSessions.reduce((h, s) => h + s.duration_min / 60, 0);
    } else {
      const sessionPoints = matchSessions.length * POINTS.menteeSession;
      total += sessionPoints;
      ledger.push({
        label: `${matchSessions.length} session${matchSessions.length > 1 ? 's' : ''} attended`,
        points: sessionPoints,
        detail: `${match.subject} mentoring`,
      });

      if (longestStreak(matchSessions) >= POINTS.streakThreshold) {
        total += POINTS.menteeStreakBonus;
        ledger.push({
          label: 'Attendance streak bonus (3+ in a row)',
          points: POINTS.menteeStreakBonus,
          detail: match.subject,
        });
      }
    }
  }

  return {
    total,
    volunteerHours: Math.round(volunteerHours * 10) / 10,
    ledger,
  };
}

/** Longest run of consecutive session numbers (a simple attendance streak). */
function longestStreak(sessions: Session[]): number {
  if (sessions.length === 0) return 0;
  let longest = 1;
  let current = 1;
  for (let i = 1; i < sessions.length; i++) {
    if (sessions[i].session_no === sessions[i - 1].session_no + 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}
