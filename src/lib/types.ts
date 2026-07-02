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

export interface Assignment {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  assigned_date: string; // ISO date (YYYY-MM-DD)
  due_date: string; // ISO date (YYYY-MM-DD)
  type: AssignmentType;
  link: string | null; // optional resource link (files come in a later phase)
  created_by: string;
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
