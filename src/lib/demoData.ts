import { SCHOOL_YEAR, type Assignment, type ClassInfo, type Enrollment, type Profile } from './types';

// In-memory mirror of supabase/seed.sql. Used only when Supabase env vars are
// absent, so the app is fully explorable before the backend is wired up.

const now = new Date().toISOString();

const iso = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

export const demoProfiles: Profile[] = [
  // Teachers
  { id: 't-anders', name: 'Ms. Anderson', role: 'teacher', grade: null, created_at: now },
  { id: 't-brooks', name: 'Mr. Brooks', role: 'teacher', grade: null, created_at: now },
  { id: 't-chen', name: 'Dr. Chen', role: 'teacher', grade: null, created_at: now },
  { id: 't-diaz', name: 'Sr. Diaz', role: 'teacher', grade: null, created_at: now },
  // Students
  { id: 's-mina', name: 'Mina (Student)', role: 'student', grade: 10, created_at: now },
  { id: 's-jay', name: 'Jay (Student)', role: 'student', grade: 11, created_at: now },
  // Admin
  { id: 'a-office', name: 'School Office', role: 'admin', grade: null, created_at: now },
];

export const demoClasses: ClassInfo[] = [
  { id: 'c-alg2', name: 'Algebra II', subject: 'Math', grade_level: 10, teacher_id: 't-anders', period: 'P1', room: '201', school_year: SCHOOL_YEAR, created_at: now },
  { id: 'c-calc', name: 'AP Calculus AB', subject: 'Math', grade_level: 11, teacher_id: 't-anders', period: 'P2', room: '201', school_year: SCHOOL_YEAR, created_at: now },
  { id: 'c-bio', name: 'Biology', subject: 'Science', grade_level: 10, teacher_id: 't-chen', period: 'P3', room: 'Lab A', school_year: SCHOOL_YEAR, created_at: now },
  { id: 'c-chem', name: 'AP Chemistry', subject: 'Science', grade_level: 11, teacher_id: 't-chen', period: 'P4', room: 'Lab B', school_year: SCHOOL_YEAR, created_at: now },
  { id: 'c-eng', name: 'English 10', subject: 'English', grade_level: 10, teacher_id: 't-brooks', period: 'P2', room: '110', school_year: SCHOOL_YEAR, created_at: now },
  { id: 'c-lit', name: 'AP English Literature', subject: 'English', grade_level: 11, teacher_id: 't-brooks', period: 'P5', room: '110', school_year: SCHOOL_YEAR, created_at: now },
  { id: 'c-hist', name: 'World History', subject: 'History', grade_level: 10, teacher_id: 't-brooks', period: 'P6', room: '115', school_year: SCHOOL_YEAR, created_at: now },
  { id: 'c-span', name: 'Spanish III', subject: 'World Language', grade_level: 10, teacher_id: 't-diaz', period: 'P1', room: '120', school_year: SCHOOL_YEAR, created_at: now },
  { id: 'c-cs', name: 'Intro to Computer Science', subject: 'Computer Science', grade_level: 10, teacher_id: 't-chen', period: 'P7', room: 'Lab C', school_year: SCHOOL_YEAR, created_at: now },
];

// Mina (grade 10) is pre-enrolled in a few classes so the demo has content.
export const demoEnrollments: Enrollment[] = [
  { id: 'e1', student_id: 's-mina', class_id: 'c-alg2', created_at: now },
  { id: 'e2', student_id: 's-mina', class_id: 'c-bio', created_at: now },
  { id: 'e3', student_id: 's-mina', class_id: 'c-eng', created_at: now },
  { id: 'e4', student_id: 's-mina', class_id: 'c-span', created_at: now },
];

export const demoAssignments: Assignment[] = [
  { id: 'a1', class_id: 'c-alg2', title: 'Quadratics worksheet §4.3', description: 'Problems 1–20, show your work.', assigned_date: iso(-2), due_date: iso(0), type: 'homework', link: null, created_by: 't-anders', created_at: now },
  { id: 'a2', class_id: 'c-alg2', title: 'Unit 4 quiz', description: 'Covers factoring and the quadratic formula.', assigned_date: iso(-5), due_date: iso(3), type: 'quiz', link: null, created_by: 't-anders', created_at: now },
  { id: 'a3', class_id: 'c-bio', title: 'Cell organelles reading', description: 'Read ch. 3 and answer the review questions.', assigned_date: iso(-1), due_date: iso(1), type: 'homework', link: 'https://example.com/bio-ch3', created_by: 't-chen', created_at: now },
  { id: 'a4', class_id: 'c-bio', title: 'Osmosis lab report', description: 'Full write-up: hypothesis, method, results, conclusion.', assigned_date: iso(-3), due_date: iso(6), type: 'project', link: null, created_by: 't-chen', created_at: now },
  { id: 'a5', class_id: 'c-eng', title: 'Essay draft: theme in "The Giver"', description: 'Two pages, double-spaced.', assigned_date: iso(-4), due_date: iso(2), type: 'homework', link: null, created_by: 't-brooks', created_at: now },
  { id: 'a6', class_id: 'c-eng', title: 'Vocabulary test — Unit 5', description: null, assigned_date: iso(-6), due_date: iso(9), type: 'test', link: null, created_by: 't-brooks', created_at: now },
  { id: 'a7', class_id: 'c-span', title: 'Preterite vs. imperfect exercises', description: 'Cuaderno pp. 44–45.', assigned_date: iso(-1), due_date: iso(4), type: 'homework', link: null, created_by: 't-diaz', created_at: now },
  { id: 'a8', class_id: 'c-span', title: 'Cultural presentation', description: 'Pick a Spanish-speaking country; 3-minute talk.', assigned_date: iso(-2), due_date: iso(20), type: 'project', link: null, created_by: 't-diaz', created_at: now },
  // A couple in other classes (visible once a student enrolls in them)
  { id: 'a9', class_id: 'c-calc', title: 'Limits practice set', description: 'Problems 1–15.', assigned_date: iso(-1), due_date: iso(2), type: 'homework', link: null, created_by: 't-anders', created_at: now },
  { id: 'a10', class_id: 'c-cs', title: 'Python: build a number-guessing game', description: 'Push your code to the shared repo.', assigned_date: iso(-2), due_date: iso(5), type: 'project', link: null, created_by: 't-chen', created_at: now },
];
