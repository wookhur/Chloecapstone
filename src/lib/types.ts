// Shared types — mirror the columns defined in supabase/schema.sql.

export type Role = 'student' | 'teacher' | 'admin' | 'counselor';

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
  syllabus: string | null;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  created_at: string;
}

export type AssignmentType = 'homework' | 'quiz' | 'test' | 'project';

export const ASSIGNMENT_TYPES: AssignmentType[] = [
  'homework',
  'quiz',
  'test',
  'project',
];

export type SubmissionKind = 'text' | 'url' | 'none' | 'quiz';

export interface Assignment {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  assigned_date: string; // ISO date (YYYY-MM-DD)
  due_date: string; // ISO date (YYYY-MM-DD)
  type: AssignmentType;
  link: string | null;
  points_possible: number;
  submission_kind: SubmissionKind;
  published: boolean;
  created_by: string;
  created_at: string;
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

/** File metadata only — actual storage comes in a later phase. */
export interface CourseFile {
  id: string;
  class_id: string;
  name: string;
  size_kb: number;
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
