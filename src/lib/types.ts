// Shared types — mirror the columns defined in supabase/schema.sql.

export type Role = 'student' | 'teacher' | 'admin';

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
  syllabus: string | null; // rich course description shown on the Syllabus tab
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
  link: string | null; // optional resource link (files come in a later phase)
  points_possible: number;
  submission_kind: SubmissionKind; // how students turn work in
  published: boolean;
  created_by: string;
  created_at: string;
}

/** A student's submission for an assignment (one per student per assignment). */
export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  body: string | null; // text entry (or JSON answers for quizzes)
  url: string | null; // website-URL submissions
  submitted_at: string | null;
  score: number | null;
  grade_comment: string | null;
  graded_at: string | null;
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

export interface CourseModule {
  id: string;
  class_id: string;
  name: string;
  position: number;
}

export type ModuleItemKind = 'assignment' | 'page' | 'link' | 'header';

export interface ModuleItem {
  id: string;
  module_id: string;
  position: number;
  kind: ModuleItemKind;
  ref_id: string | null; // assignment id or page id
  title: string; // used for header / link items
  url: string | null; // external link items
}

export interface WikiPage {
  id: string;
  class_id: string;
  title: string;
  body: string;
  updated_at: string;
  created_at: string;
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

export interface Conversation {
  id: string;
  subject: string;
  participant_ids: string[];
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
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
