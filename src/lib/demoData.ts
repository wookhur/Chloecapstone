import { toISODate } from './dates';
import {
  SCHOOL_YEAR,
  type Announcement,
  type Assignment,
  type CalendarEvent,
  type ClassInfo,
  type Completion,
  type CourseFile,
  type DiscussionPost,
  type DiscussionTopic,
  type Enrollment,
  type Guardianship,
  type MeetingRequest,
  type PracticeQuestion,
  type PracticeQuiz,
  type Profile,
} from './types';

// In-memory mirror of supabase/seed.sql. Used only when Supabase env vars are
// absent, so the app is fully explorable before the backend is wired up.

const now = new Date().toISOString();

const iso = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return toISODate(d);
};

/** Full timestamp offset by days, for created_at ordering in feeds. */
const ts = (offsetDays: number, hour = 9) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
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
  { id: 's-leo', name: 'Leo (Student)', role: 'student', grade: 10, created_at: now },
  { id: 's-zoe', name: 'Zoe (Student)', role: 'student', grade: 10, created_at: now },
  // Parent
  { id: 'pa-kim', name: 'Mrs. Kim (Parent)', role: 'parent', grade: null, created_at: now },
  // Counselor
  { id: 'co-rivera', name: 'Ms. Rivera (Counselor)', role: 'counselor', grade: null, created_at: now },
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

export const demoEnrollments: Enrollment[] = [
  { id: 'e1', student_id: 's-mina', class_id: 'c-alg2', created_at: now },
  { id: 'e2', student_id: 's-mina', class_id: 'c-bio', created_at: now },
  { id: 'e3', student_id: 's-mina', class_id: 'c-eng', created_at: now },
  { id: 'e4', student_id: 's-mina', class_id: 'c-span', created_at: now },
  { id: 'e5', student_id: 's-leo', class_id: 'c-alg2', created_at: now },
  { id: 'e6', student_id: 's-leo', class_id: 'c-bio', created_at: now },
  { id: 'e7', student_id: 's-leo', class_id: 'c-cs', created_at: now },
  { id: 'e8', student_id: 's-zoe', class_id: 'c-alg2', created_at: now },
  { id: 'e9', student_id: 's-zoe', class_id: 'c-eng', created_at: now },
  { id: 'e10', student_id: 's-zoe', class_id: 'c-hist', created_at: now },
  { id: 'e11', student_id: 's-jay', class_id: 'c-calc', created_at: now },
  { id: 'e12', student_id: 's-jay', class_id: 'c-chem', created_at: now },
  { id: 'e13', student_id: 's-jay', class_id: 'c-lit', created_at: now },
];

// Mrs. Kim follows Mina.
export const demoGuardianships: Guardianship[] = [
  { id: 'g1', parent_id: 'pa-kim', student_id: 's-mina', created_at: now },
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
  { id: 'a9', class_id: 'c-calc', title: 'Limits practice set', description: 'Problems 1–15.', assigned_date: iso(-1), due_date: iso(2), type: 'homework', link: null, created_by: 't-anders', created_at: now },
  { id: 'a10', class_id: 'c-cs', title: 'Python: build a number-guessing game', description: 'Push your code to the shared repo.', assigned_date: iso(-2), due_date: iso(5), type: 'project', link: null, created_by: 't-chen', created_at: now },
  // Past-due work so the "Past" section and overdue styling have content on load.
  { id: 'a11', class_id: 'c-alg2', title: 'Factoring warm-up §4.1', description: 'Problems 1–12.', assigned_date: iso(-10), due_date: iso(-6), type: 'homework', link: null, created_by: 't-anders', created_at: now },
  { id: 'a12', class_id: 'c-alg2', title: 'Unit 3 test — polynomials', description: null, assigned_date: iso(-14), due_date: iso(-7), type: 'test', link: null, created_by: 't-anders', created_at: now },
  { id: 'a13', class_id: 'c-bio', title: 'Microscope lab worksheet', description: 'Complete during lab.', assigned_date: iso(-9), due_date: iso(-4), type: 'homework', link: null, created_by: 't-chen', created_at: now },
  { id: 'a14', class_id: 'c-eng', title: 'Reading log — weeks 1–2', description: null, assigned_date: iso(-12), due_date: iso(-5), type: 'homework', link: null, created_by: 't-brooks', created_at: now },
];

// A few things Mina has already ticked off, so the checked state is visible
// immediately without the demo looking like nothing has been done.
export const demoCompletions: Completion[] = [
  { id: 'cp1', assignment_id: 'a11', student_id: 's-mina', completed_at: ts(-7, 20) },
  { id: 'cp2', assignment_id: 'a12', student_id: 's-mina', completed_at: ts(-8, 18) },
  { id: 'cp3', assignment_id: 'a13', student_id: 's-mina', completed_at: ts(-5, 16) },
  { id: 'cp4', assignment_id: 'a3', student_id: 's-mina', completed_at: ts(0, 8) },
  { id: 'cp5', assignment_id: 'a11', student_id: 's-leo', completed_at: ts(-6, 21) },
];

export const demoAnnouncements: Announcement[] = [
  { id: 'an1', class_id: 'c-alg2', author_id: 't-anders', title: 'Unit 4 quiz moved to this week', body: 'Heads up — the Unit 4 quiz is this week. One attempt, calculators allowed.', created_at: ts(-1, 8) },
  { id: 'an2', class_id: 'c-alg2', author_id: 't-anders', title: 'Office hours this week', body: 'Extra help Tuesday and Thursday at lunch in Room 201. Bring your §4.3 questions!', created_at: ts(-3, 12) },
  { id: 'an3', class_id: 'c-bio', author_id: 't-chen', title: 'Lab safety reminder', body: 'Closed-toe shoes required for the osmosis lab. No exceptions — you will be sent to the library otherwise.', created_at: ts(-2, 9) },
  { id: 'an4', class_id: 'c-eng', author_id: 't-brooks', title: 'Essay drafts due soon', body: 'Your "Giver" theme drafts are due this week. Turn in something, even if rough.', created_at: ts(-1, 14) },
  { id: 'an5', class_id: 'c-span', author_id: 't-diaz', title: '¡Bienvenidos!', body: 'Presentation sign-ups for the cultural project are posted on the door. First come, first served for countries.', created_at: ts(-4, 10) },
];

export const demoDiscussionTopics: DiscussionTopic[] = [
  { id: 'dt1', class_id: 'c-alg2', author_id: 't-anders', title: 'Where do you get stuck on word problems?', body: 'Post the step where quadratic word problems go wrong for you. Reply to at least one classmate with a suggestion.', created_at: ts(-3, 9) },
  { id: 'dt2', class_id: 'c-bio', author_id: 't-chen', title: 'Osmosis in real life', body: 'Share one everyday example of osmosis or diffusion you noticed this week.', created_at: ts(-2, 11) },
  { id: 'dt3', class_id: 'c-eng', author_id: 't-brooks', title: 'Is Jonas\'s community a utopia or dystopia?', body: 'Take a side and defend it with one quote from the first eight chapters.', created_at: ts(-4, 13) },
  { id: 'dt4', class_id: 'c-alg2', author_id: 's-zoe', title: 'Study group for the Unit 4 quiz?', body: 'Anyone want to meet in the library Thursday to review factoring and the quadratic formula?', created_at: ts(-1, 16) },
  { id: 'dt5', class_id: 'c-span', author_id: 's-mina', title: 'Preterite vs imperfect — any tricks?', body: 'I keep mixing these up. How do you remember which one to use?', created_at: ts(0, 8) },
];

export const demoDiscussionPosts: DiscussionPost[] = [
  { id: 'dp1', topic_id: 'dt1', author_id: 's-mina', body: 'Setting up the equation from the words. Once it\'s written I can solve it fine.', created_at: ts(-2, 16) },
  { id: 'dp2', topic_id: 'dt1', author_id: 's-leo', body: 'Same as Mina — also knowing which solution to throw away (like negative lengths).', created_at: ts(-2, 18) },
  { id: 'dp3', topic_id: 'dt1', author_id: 's-zoe', body: '@Leo I circle the units in the problem first, it helps me pick the variable.', created_at: ts(-1, 7) },
  { id: 'dp4', topic_id: 'dt2', author_id: 's-mina', body: 'Salting cucumbers for kimchi — water comes right out of them!', created_at: ts(-1, 17) },
  { id: 'dp5', topic_id: 'dt3', author_id: 's-zoe', body: 'Dystopia. "We really have to protect people from wrong choices" shows they gave up freedom.', created_at: ts(-3, 15) },
  { id: 'dp6', topic_id: 'dt4', author_id: 's-leo', body: 'I\'m in! Thursday after 6th period works.', created_at: ts(-1, 18) },
  { id: 'dp7', topic_id: 'dt4', author_id: 's-mina', body: 'Same, count me in. I\'ll bring the practice quiz I made.', created_at: ts(0, 9) },
];

// Quizlet-style practice quizzes made by students for their classmates.
export const demoPracticeQuizzes: PracticeQuiz[] = [
  { id: 'pq1', class_id: 'c-alg2', author_id: 's-mina', title: 'Quadratics self-check', description: 'Made this while studying for Unit 4 — good luck!', created_at: ts(-2, 19) },
  { id: 'pq2', class_id: 'c-alg2', author_id: 's-zoe', title: 'Factoring speed round', description: 'Quick factoring practice.', created_at: ts(-1, 20) },
  { id: 'pq3', class_id: 'c-bio', author_id: 's-leo', title: 'Cell organelles flashcards', description: 'Know your organelles for the quiz.', created_at: ts(-1, 18) },
  { id: 'pq4', class_id: 'c-eng', author_id: 's-zoe', title: 'Unit 5 vocab practice', description: null, created_at: ts(-3, 17) },
];

export const demoPracticeQuestions: PracticeQuestion[] = [
  { id: 'pqq1', quiz_id: 'pq1', position: 1, question: 'What are the roots of x² − 5x + 6 = 0?', choices: ['x = 2, 3', 'x = −2, −3', 'x = 1, 6', 'x = −1, −6'], correct_index: 0 },
  { id: 'pqq2', quiz_id: 'pq1', position: 2, question: 'The discriminant of ax² + bx + c is…', choices: ['b² − 4ac', 'b² + 4ac', '−b ± 2ac', '4ac − b²'], correct_index: 0 },
  { id: 'pqq3', quiz_id: 'pq1', position: 3, question: 'If the discriminant is negative, the equation has…', choices: ['two real roots', 'one real root', 'no real roots', 'infinitely many roots'], correct_index: 2 },
  { id: 'pqq4', quiz_id: 'pq1', position: 4, question: 'The vertex of y = (x − 2)² + 5 is…', choices: ['(−2, 5)', '(2, −5)', '(2, 5)', '(5, 2)'], correct_index: 2 },
  { id: 'pqq5', quiz_id: 'pq2', position: 1, question: 'Factor: x² − 9', choices: ['(x − 3)(x − 3)', '(x + 3)(x − 3)', '(x + 9)(x − 1)', 'prime'], correct_index: 1 },
  { id: 'pqq6', quiz_id: 'pq2', position: 2, question: 'Factor: x² + 5x + 6', choices: ['(x + 2)(x + 3)', '(x + 1)(x + 6)', '(x − 2)(x − 3)', '(x + 5)(x + 1)'], correct_index: 0 },
  { id: 'pqq7', quiz_id: 'pq2', position: 3, question: 'Factor: x² − 4x', choices: ['x(x − 4)', '(x − 2)(x + 2)', 'x(x + 4)', '4(x − 1)'], correct_index: 0 },
  { id: 'pqq8', quiz_id: 'pq3', position: 1, question: 'Which organelle makes ATP?', choices: ['Nucleus', 'Ribosome', 'Mitochondrion', 'Vacuole'], correct_index: 2 },
  { id: 'pqq9', quiz_id: 'pq3', position: 2, question: 'Where are proteins built?', choices: ['Ribosome', 'Lysosome', 'Chloroplast', 'Cell wall'], correct_index: 0 },
  { id: 'pqq10', quiz_id: 'pq3', position: 3, question: 'Photosynthesis happens in the…', choices: ['Mitochondrion', 'Chloroplast', 'Nucleus', 'Membrane'], correct_index: 1 },
  { id: 'pqq11', quiz_id: 'pq4', position: 1, question: '"Ubiquitous" most nearly means…', choices: ['rare', 'everywhere', 'ancient', 'transparent'], correct_index: 1 },
  { id: 'pqq12', quiz_id: 'pq4', position: 2, question: '"Candid" most nearly means…', choices: ['sweet', 'hidden', 'honest', 'nervous'], correct_index: 2 },
  { id: 'pqq13', quiz_id: 'pq4', position: 3, question: '"Ephemeral" most nearly means…', choices: ['short-lived', 'heavenly', 'glowing', 'repeated'], correct_index: 0 },
];

export const demoFiles: CourseFile[] = [
  { id: 'f1', class_id: 'c-alg2', name: 'unit4-formula-sheet.pdf', size_kb: 182, uploaded_by: 't-anders', created_at: ts(-5) },
  { id: 'f2', class_id: 'c-alg2', name: 'ch4-practice-answers.pdf', size_kb: 240, uploaded_by: 't-anders', created_at: ts(-2) },
  { id: 'f3', class_id: 'c-bio', name: 'osmosis-lab-handout.pdf', size_kb: 415, uploaded_by: 't-chen', created_at: ts(-3) },
  { id: 'f4', class_id: 'c-bio', name: 'cell-diagram-labeled.png', size_kb: 1024, uploaded_by: 't-chen', created_at: ts(-9) },
  { id: 'f5', class_id: 'c-eng', name: 'giver-discussion-questions.docx', size_kb: 88, uploaded_by: 't-brooks', created_at: ts(-4) },
];

// One request waiting on Ms. Rivera, so the counselor console has something to
// act on the moment the demo loads.
export const demoMeetingRequests: MeetingRequest[] = [
  { id: 'mr1', student_id: 's-zoe', counselor_id: 'co-rivera', reason: 'Questions about signing up for AP classes next year', preferred: 'Any lunch period this week', status: 'pending', response: null, created_at: ts(-1, 12) },
  { id: 'mr2', student_id: 's-leo', counselor_id: 'co-rivera', reason: 'Need to talk about my schedule', preferred: null, status: 'accepted', response: null, created_at: ts(-6, 9) },
];

// Calendar entries: Mina's own events, plus a counseling meeting Ms. Rivera
// scheduled onto Mina's calendar.
export const demoCalendarEvents: CalendarEvent[] = [
  { id: 'ce1', owner_id: 's-mina', title: 'Dentist appointment', date: iso(1), category: 'personal', note: '3:30pm — leave right after school', created_by: 's-mina', created_at: now },
  { id: 'ce2', owner_id: 's-mina', title: 'Study group (library)', date: iso(2), category: 'meeting', note: 'Unit 4 quiz review with Leo & Zoe', created_by: 's-mina', created_at: now },
  { id: 'ce3', owner_id: 's-mina', title: 'Soccer practice', date: iso(3), category: 'event', note: null, created_by: 's-mina', created_at: now },
  { id: 'ce4', owner_id: 's-mina', title: 'Turn in permission slip', date: iso(0), category: 'reminder', note: 'For the museum field trip', created_by: 's-mina', created_at: now },
  { id: 'ce5', owner_id: 's-mina', title: 'Counselor check-in — Ms. Rivera', date: iso(5), category: 'counseling', note: 'College application timeline. Room 102, 11:15am.', created_by: 'co-rivera', created_at: now },
  { id: 'ce6', owner_id: 's-leo', title: 'Counselor check-in — Ms. Rivera', date: iso(4), category: 'counseling', note: 'Course selection for next year.', created_by: 'co-rivera', created_at: now },
];
