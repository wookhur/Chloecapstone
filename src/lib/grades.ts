import { parseISO, today } from './dates';
import type { Assignment, Submission } from './types';

// Grade math shared by the student Grades tab, the teacher Gradebook,
// and the dashboard course cards.

export type SubmissionStatus = 'graded' | 'submitted' | 'late' | 'missing' | 'unsubmitted';

/** Canvas-style status for one student on one assignment. */
export function submissionStatus(
  assignment: Assignment,
  submission: Submission | undefined,
): SubmissionStatus {
  const pastDue = parseISO(assignment.due_date) < parseISO(today());
  if (submission?.graded_at != null && submission.score != null) return 'graded';
  if (submission?.submitted_at) {
    return submission.submitted_at.slice(0, 10) > assignment.due_date ? 'late' : 'submitted';
  }
  return pastDue ? 'missing' : 'unsubmitted';
}

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  graded: 'Graded',
  submitted: 'Submitted',
  late: 'Late',
  missing: 'Missing',
  unsubmitted: 'Not submitted',
};

/** Percentage across everything graded so far. Null until something is graded. */
export function courseGrade(
  assignments: Assignment[],
  submissions: Submission[],
  studentId: string,
): { earned: number; possible: number; percent: number } | null {
  let earned = 0;
  let possible = 0;
  for (const a of assignments) {
    const sub = submissions.find(
      (s) => s.assignment_id === a.id && s.student_id === studentId,
    );
    if (sub?.graded_at != null && sub.score != null) {
      earned += sub.score;
      possible += a.points_possible;
    }
  }
  if (possible === 0) return null;
  return { earned, possible, percent: (earned / possible) * 100 };
}

/** Standard US letter-grade cutoffs. */
export function letterGrade(percent: number): string {
  if (percent >= 93) return 'A';
  if (percent >= 90) return 'A-';
  if (percent >= 87) return 'B+';
  if (percent >= 83) return 'B';
  if (percent >= 80) return 'B-';
  if (percent >= 77) return 'C+';
  if (percent >= 73) return 'C';
  if (percent >= 70) return 'C-';
  if (percent >= 67) return 'D+';
  if (percent >= 63) return 'D';
  if (percent >= 60) return 'D-';
  return 'F';
}

export function formatPercent(p: number): string {
  return `${p.toFixed(1).replace(/\.0$/, '')}%`;
}
