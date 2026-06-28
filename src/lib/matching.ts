import type {
  MenteeSubject,
  MentorSubject,
  Profile,
  ScoreBreakdown,
} from './types';

/**
 * Relationship-centered matching — the heart of Yeon.
 *
 * The algorithm narrows candidates; the coordinator makes the final call.
 * Weights (from the proposal): subject fit 40, interest/personality
 * compatibility 35, time overlap 15, coordinator adjustment 10.
 */
export const WEIGHTS = {
  subject: 40,
  compatibility: 35,
  time: 15,
  coordinator: 10,
} as const;

function mentorSubjects(p: Profile): MentorSubject[] {
  return (p.subjects as MentorSubject[]).filter(
    (s) => typeof s?.strength === 'number',
  );
}

function menteeSubjects(p: Profile): MenteeSubject[] {
  return (p.subjects as MenteeSubject[]).filter(
    (s) => typeof s?.need === 'number',
  );
}

/** Subjects a mentor can teach that the mentee needs help with. */
export function sharedSubjects(mentor: Profile, mentee: Profile): string[] {
  const teachable = new Set(mentorSubjects(mentor).map((s) => s.subject));
  return menteeSubjects(mentee)
    .map((s) => s.subject)
    .filter((subject) => teachable.has(subject));
}

/** 0–1: how well the mentor's strength covers the mentee's need for a subject. */
function subjectFit(mentor: Profile, mentee: Profile, subject: string): number {
  const strength =
    mentorSubjects(mentor).find((s) => s.subject === subject)?.strength ?? 0;
  const need =
    menteeSubjects(mentee).find((s) => s.subject === subject)?.need ?? 0;
  if (!strength || !need) return 0;
  // Reward strong mentors; lightly favor a strength that meets/exceeds need.
  const coverage = Math.min(strength / Math.max(need, 1), 1);
  const strengthScore = strength / 5;
  return 0.5 * coverage + 0.5 * strengthScore;
}

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter((x) => setB.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * 0–1: interest overlap + communication-style match + personality overlap.
 * This is the "people compatibility" that sets Yeon apart from subject-only
 * matching.
 */
export function compatibility(mentor: Profile, mentee: Profile): number {
  const interestScore = jaccard(mentor.interests, mentee.interests);
  const styleScore =
    mentor.communication_style &&
    mentor.communication_style === mentee.communication_style
      ? 1
      : 0;
  const personalityScore = jaccard(mentor.personality_tags, mentee.personality_tags);
  // Interests carry the most signal; style is a clear bonus; personality nudges.
  return 0.6 * interestScore + 0.3 * styleScore + 0.1 * personalityScore;
}

/** 0–1: fraction of the mentee's availability the mentor also has free. */
export function timeOverlap(mentor: Profile, mentee: Profile): number {
  if (mentee.availability.length === 0) return 0;
  const mentorSlots = new Set(mentor.availability);
  const overlap = mentee.availability.filter((s) => mentorSlots.has(s)).length;
  return overlap / mentee.availability.length;
}

export interface Recommendation {
  mentor: Profile;
  mentee: Profile;
  subject: string;
  score: number; // 0–100
  breakdown: ScoreBreakdown;
  commonInterests: string[];
  styleMatch: boolean;
}

/**
 * Score one mentor↔mentee pairing for a subject.
 * `coordinatorAdjustment` is a -10..+10 nudge applied by the coordinator.
 */
export function scorePair(
  mentor: Profile,
  mentee: Profile,
  subject: string,
  coordinatorAdjustment = 0,
): Recommendation {
  const subjectComponent = subjectFit(mentor, mentee, subject) * WEIGHTS.subject;
  const compatibilityComponent = compatibility(mentor, mentee) * WEIGHTS.compatibility;
  const timeComponent = timeOverlap(mentor, mentee) * WEIGHTS.time;

  // Coordinator weight starts neutral (half of its 10 points) and is nudged.
  const coordinatorComponent = Math.max(
    0,
    Math.min(WEIGHTS.coordinator, WEIGHTS.coordinator / 2 + coordinatorAdjustment),
  );

  const breakdown: ScoreBreakdown = {
    subject: round(subjectComponent),
    compatibility: round(compatibilityComponent),
    time: round(timeComponent),
    coordinator: round(coordinatorComponent),
  };

  const score = round(
    breakdown.subject +
      breakdown.compatibility +
      breakdown.time +
      breakdown.coordinator,
  );

  const commonInterests = mentor.interests.filter((i) =>
    mentee.interests.includes(i),
  );

  return {
    mentor,
    mentee,
    subject,
    score,
    breakdown,
    commonInterests,
    styleMatch:
      !!mentor.communication_style &&
      mentor.communication_style === mentee.communication_style,
  };
}

/**
 * Recommend mentors for a mentee: filter to mentors who can teach a needed
 * subject and are an equal-or-higher grade, then rank by score.
 */
export function recommendMentorsFor(
  mentee: Profile,
  mentors: Profile[],
): Recommendation[] {
  const recs: Recommendation[] = [];
  for (const mentor of mentors) {
    if (mentor.grade != null && mentee.grade != null && mentor.grade < mentee.grade) {
      continue; // mentors should be an upper / equal grade
    }
    for (const subject of sharedSubjects(mentor, mentee)) {
      recs.push(scorePair(mentor, mentee, subject));
    }
  }
  return recs.sort((a, b) => b.score - a.score);
}

/** Recommend mentees a mentor could help, ranked by score. */
export function recommendMenteesFor(
  mentor: Profile,
  mentees: Profile[],
): Recommendation[] {
  const recs: Recommendation[] = [];
  for (const mentee of mentees) {
    if (mentor.grade != null && mentee.grade != null && mentor.grade < mentee.grade) {
      continue;
    }
    for (const subject of sharedSubjects(mentor, mentee)) {
      recs.push(scorePair(mentor, mentee, subject));
    }
  }
  return recs.sort((a, b) => b.score - a.score);
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
