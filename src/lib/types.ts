// Shared types — mirror the columns defined in supabase/schema.sql.

export type Role = 'student' | 'teacher' | 'admin' | 'counselor' | 'parent';

export interface Profile {
  id: string;
  name: string;
  role: Role;
  grade: number | null;
  created_at: string;
}

/** A class in the catalog (a course taught by one teacher for a school year). */
export interface ClassInfo {
  id: string;
  name: string;
  subject: string;
  grade_level: number | null;
  teacher_id: string;
  period: string | null;
  room: string | null;
  school_year: string;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  created_at: string;
}

/**
 * Links a parent/guardian account to a student. A parent sees that student's
 * upcoming work and counseling meetings and can do nothing else — no posting,
 * no ticking work off, since the checklist belongs to the student.
 */
export interface Guardianship {
  id: string;
  parent_id: string;
  student_id: string;
  created_at: string;
}

export type AssignmentType = 'homework' | 'quiz' | 'test' | 'project';

export const ASSIGNMENT_TYPES: AssignmentType[] = [
  'homework',
  'quiz',
  'test',
  'project',
];

/**
 * Assignments are informational: this app tracks what's due, while the school's
 * system of record (PowerSchool) owns points and grading. No submission fields.
 */
export interface Assignment {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  assigned_date: string; // ISO date (YYYY-MM-DD)
  due_date: string; // ISO date (YYYY-MM-DD)
  type: AssignmentType;
  link: string | null;
  created_by: string | null; // null once the posting teacher's profile is removed
  created_at: string;
}

/**
 * A student ticking their own checklist. Private to that student and never a
 * grade — teachers don't see it. It exists so the app can replace the paper
 * planner students are already crossing things off in.
 */
export interface Completion {
  id: string;
  assignment_id: string;
  student_id: string;
  completed_at: string;
}

export interface Announcement {
  id: string;
  class_id: string;
  author_id: string;
  title: string;
  body: string;
  created_at: string;
}

export interface DiscussionTopic {
  id: string;
  class_id: string;
  author_id: string;
  title: string;
  body: string;
  created_at: string;
}

export interface DiscussionPost {
  id: string;
  topic_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

/**
 * Quizlet-style practice quiz: made by a student (or teacher) for a course, so
 * classmates can practice. Not graded — just self-check practice.
 */
export interface PracticeQuiz {
  id: string;
  class_id: string;
  author_id: string;
  title: string;
  description: string | null;
  created_at: string;
}

/** A multiple-choice question inside a practice quiz. */
export interface PracticeQuestion {
  id: string;
  quiz_id: string;
  position: number;
  question: string;
  choices: string[];
  correct_index: number;
}

/**
 * A course handout. The row is metadata; the bytes live in Supabase Storage at
 * `storage_path`. Rows created before storage existed have no path, so they
 * show in the list but can't be opened.
 */
export interface CourseFile {
  id: string;
  class_id: string;
  name: string;
  size_kb: number;
  storage_path: string | null;
  uploaded_by: string;
  created_at: string;
}

/** A calendar entry added by hand (personal, or a counselor meeting for a student). */
export type CalendarEventCategory =
  | 'event'
  | 'exam'
  | 'reminder'
  | 'personal'
  | 'meeting'
  | 'counseling';

export const CALENDAR_CATEGORIES: {
  key: CalendarEventCategory;
  label: string;
  emoji: string;
  color: string;
}[] = [
  { key: 'event', label: 'Event', emoji: '📌', color: '#3b6fd4' },
  { key: 'exam', label: 'Exam', emoji: '🧪', color: '#d24b45' },
  { key: 'reminder', label: 'Reminder', emoji: '⏰', color: '#a9772a' },
  { key: 'personal', label: 'Personal', emoji: '⭐', color: '#8a53c4' },
  { key: 'meeting', label: 'Meeting', emoji: '👥', color: '#2a8ea9' },
  { key: 'counseling', label: 'Counseling', emoji: '🧭', color: '#0e8a7d' },
];

export type MeetingRequestStatus = 'pending' | 'accepted' | 'declined';

/**
 * A student asking a counselor for time. Counselor scheduling used to be
 * one-way, which meant a student who needed to talk still had to send an email
 * and wait — the exact gap this app exists to close.
 */
export interface MeetingRequest {
  id: string;
  student_id: string;
  counselor_id: string | null; // null = whoever picks it up
  reason: string;
  preferred: string | null; // free text, e.g. "any lunch this week"
  status: MeetingRequestStatus;
  response: string | null; // counselor's note when declining or rescheduling
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  owner_id: string; // whose calendar it shows on
  title: string;
  date: string; // YYYY-MM-DD
  category: CalendarEventCategory;
  note: string | null;
  created_by: string | null; // who added it (a counselor, or the owner themselves)
  created_at: string;
}

export const SUBJECTS = [
  'Math',
  'Science',
  'English',
  'History',
  'World Language',
  'Computer Science',
  'Arts',
  'PE / Health',
] as const;

/** The current/next school year the picker targets. */
export const SCHOOL_YEAR = '2026-2027';
