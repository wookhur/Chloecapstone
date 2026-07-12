import {
  SCHOOL_YEAR,
  type Announcement,
  type Assignment,
  type ClassInfo,
  type Conversation,
  type CourseFile,
  type CourseModule,
  type DiscussionPost,
  type DiscussionTopic,
  type Enrollment,
  type Message,
  type ModuleItem,
  type PracticeQuestion,
  type PracticeQuiz,
  type Profile,
  type Submission,
  type WikiPage,
} from './types';

// In-memory mirror of supabase/seed.sql. Used only when Supabase env vars are
// absent, so the app is fully explorable before the backend is wired up.

const now = new Date().toISOString();

const iso = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
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
  // Admin
  { id: 'a-office', name: 'School Office', role: 'admin', grade: null, created_at: now },
];

const ALG2_SYLLABUS = `Welcome to Algebra II! This year we cover quadratics, polynomials, exponentials, logarithms, and an introduction to trigonometry.

Grading: homework 30%, quizzes 30%, tests 30%, projects 10%.
Late work loses 10% per day, up to 3 days. Retakes are available for quizzes below 70%.

Office hours: Tuesday & Thursday lunch, Room 201.`;

const BIO_SYLLABUS = `Biology is the study of living systems — cells, genetics, evolution, and ecology.

Expect one lab per week; lab reports are due the following Monday. Safety contract must be signed before any lab work.

Grading: labs 40%, quizzes/tests 40%, homework 20%.`;

export const demoClasses: ClassInfo[] = [
  { id: 'c-alg2', name: 'Algebra II', subject: 'Math', grade_level: 10, teacher_id: 't-anders', period: 'P1', room: '201', school_year: SCHOOL_YEAR, syllabus: ALG2_SYLLABUS, created_at: now },
  { id: 'c-calc', name: 'AP Calculus AB', subject: 'Math', grade_level: 11, teacher_id: 't-anders', period: 'P2', room: '201', school_year: SCHOOL_YEAR, syllabus: null, created_at: now },
  { id: 'c-bio', name: 'Biology', subject: 'Science', grade_level: 10, teacher_id: 't-chen', period: 'P3', room: 'Lab A', school_year: SCHOOL_YEAR, syllabus: BIO_SYLLABUS, created_at: now },
  { id: 'c-chem', name: 'AP Chemistry', subject: 'Science', grade_level: 11, teacher_id: 't-chen', period: 'P4', room: 'Lab B', school_year: SCHOOL_YEAR, syllabus: null, created_at: now },
  { id: 'c-eng', name: 'English 10', subject: 'English', grade_level: 10, teacher_id: 't-brooks', period: 'P2', room: '110', school_year: SCHOOL_YEAR, syllabus: null, created_at: now },
  { id: 'c-lit', name: 'AP English Literature', subject: 'English', grade_level: 11, teacher_id: 't-brooks', period: 'P5', room: '110', school_year: SCHOOL_YEAR, syllabus: null, created_at: now },
  { id: 'c-hist', name: 'World History', subject: 'History', grade_level: 10, teacher_id: 't-brooks', period: 'P6', room: '115', school_year: SCHOOL_YEAR, syllabus: null, created_at: now },
  { id: 'c-span', name: 'Spanish III', subject: 'World Language', grade_level: 10, teacher_id: 't-diaz', period: 'P1', room: '120', school_year: SCHOOL_YEAR, syllabus: null, created_at: now },
  { id: 'c-cs', name: 'Intro to Computer Science', subject: 'Computer Science', grade_level: 10, teacher_id: 't-chen', period: 'P7', room: 'Lab C', school_year: SCHOOL_YEAR, syllabus: null, created_at: now },
];

// Mina, Leo and Zoe (grade 10) share several classes so rosters, discussions
// and the teacher gradebook have real content. Jay (grade 11) takes AP classes.
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

export const demoAssignments: Assignment[] = [
  { id: 'a1', class_id: 'c-alg2', title: 'Quadratics worksheet §4.3', description: 'Problems 1–20, show your work.', assigned_date: iso(-2), due_date: iso(0), type: 'homework', link: null, points_possible: 20, submission_kind: 'text', published: true, created_by: 't-anders', created_at: now },
  { id: 'a2', class_id: 'c-alg2', title: 'Unit 4 quiz', description: 'Covers factoring and the quadratic formula.', assigned_date: iso(-5), due_date: iso(3), type: 'quiz', link: null, points_possible: 10, submission_kind: 'quiz', published: true, created_by: 't-anders', created_at: now },
  { id: 'a3', class_id: 'c-bio', title: 'Cell organelles reading', description: 'Read ch. 3 and answer the review questions.', assigned_date: iso(-1), due_date: iso(1), type: 'homework', link: 'https://example.com/bio-ch3', points_possible: 10, submission_kind: 'text', published: true, created_by: 't-chen', created_at: now },
  { id: 'a4', class_id: 'c-bio', title: 'Osmosis lab report', description: 'Full write-up: hypothesis, method, results, conclusion.', assigned_date: iso(-3), due_date: iso(6), type: 'project', link: null, points_possible: 50, submission_kind: 'text', published: true, created_by: 't-chen', created_at: now },
  { id: 'a5', class_id: 'c-eng', title: 'Essay draft: theme in "The Giver"', description: 'Two pages, double-spaced.', assigned_date: iso(-4), due_date: iso(2), type: 'homework', link: null, points_possible: 30, submission_kind: 'text', published: true, created_by: 't-brooks', created_at: now },
  { id: 'a6', class_id: 'c-eng', title: 'Vocabulary test — Unit 5', description: null, assigned_date: iso(-6), due_date: iso(9), type: 'test', link: null, points_possible: 15, submission_kind: 'quiz', published: true, created_by: 't-brooks', created_at: now },
  { id: 'a7', class_id: 'c-span', title: 'Preterite vs. imperfect exercises', description: 'Cuaderno pp. 44–45.', assigned_date: iso(-1), due_date: iso(4), type: 'homework', link: null, points_possible: 20, submission_kind: 'text', published: true, created_by: 't-diaz', created_at: now },
  { id: 'a8', class_id: 'c-span', title: 'Cultural presentation', description: 'Pick a Spanish-speaking country; 3-minute talk.', assigned_date: iso(-2), due_date: iso(20), type: 'project', link: null, points_possible: 40, submission_kind: 'url', published: true, created_by: 't-diaz', created_at: now },
  { id: 'a9', class_id: 'c-calc', title: 'Limits practice set', description: 'Problems 1–15.', assigned_date: iso(-1), due_date: iso(2), type: 'homework', link: null, points_possible: 15, submission_kind: 'text', published: true, created_by: 't-anders', created_at: now },
  { id: 'a10', class_id: 'c-cs', title: 'Python: build a number-guessing game', description: 'Push your code to the shared repo.', assigned_date: iso(-2), due_date: iso(5), type: 'project', link: null, points_possible: 25, submission_kind: 'url', published: true, created_by: 't-chen', created_at: now },
  // Past work so Grades has history the moment the demo loads.
  { id: 'a11', class_id: 'c-alg2', title: 'Factoring warm-up §4.1', description: 'Problems 1–12.', assigned_date: iso(-10), due_date: iso(-6), type: 'homework', link: null, points_possible: 12, submission_kind: 'text', published: true, created_by: 't-anders', created_at: now },
  { id: 'a12', class_id: 'c-alg2', title: 'Unit 3 test — polynomials', description: null, assigned_date: iso(-14), due_date: iso(-7), type: 'test', link: null, points_possible: 100, submission_kind: 'text', published: true, created_by: 't-anders', created_at: now },
  { id: 'a13', class_id: 'c-bio', title: 'Microscope lab worksheet', description: 'Complete during lab.', assigned_date: iso(-9), due_date: iso(-4), type: 'homework', link: null, points_possible: 20, submission_kind: 'text', published: true, created_by: 't-chen', created_at: now },
  { id: 'a14', class_id: 'c-eng', title: 'Reading log — weeks 1–2', description: null, assigned_date: iso(-12), due_date: iso(-5), type: 'homework', link: null, points_possible: 10, submission_kind: 'text', published: true, created_by: 't-brooks', created_at: now },
];

// Submissions: a mix of graded, submitted-not-graded, late and missing so
// every status renders somewhere in the demo.
export const demoSubmissions: Submission[] = [
  // Graded history
  { id: 'sub1', assignment_id: 'a11', student_id: 's-mina', body: 'Answers attached — see work for #7 and #11.', url: null, submitted_at: ts(-7, 20), score: 11, grade_comment: 'Nice work. Watch the sign on #9.', graded_at: ts(-5), created_at: ts(-7, 20) },
  { id: 'sub2', assignment_id: 'a11', student_id: 's-leo', body: 'Done. #12 was tricky.', url: null, submitted_at: ts(-6, 21), score: 9, grade_comment: 'Check your factoring on #4 and #12.', graded_at: ts(-5), created_at: ts(-6, 21) },
  { id: 'sub3', assignment_id: 'a11', student_id: 's-zoe', body: 'Finished in study hall.', url: null, submitted_at: ts(-7, 15), score: 12, grade_comment: 'Perfect!', graded_at: ts(-5), created_at: ts(-7, 15) },
  { id: 'sub4', assignment_id: 'a12', student_id: 's-mina', body: '(paper test)', url: null, submitted_at: ts(-7, 10), score: 88, grade_comment: 'Strong on synthetic division; review end behavior.', graded_at: ts(-4), created_at: ts(-7, 10) },
  { id: 'sub5', assignment_id: 'a12', student_id: 's-leo', body: '(paper test)', url: null, submitted_at: ts(-7, 10), score: 76, grade_comment: 'Come to office hours — let’s go over factoring.', graded_at: ts(-4), created_at: ts(-7, 10) },
  { id: 'sub6', assignment_id: 'a12', student_id: 's-zoe', body: '(paper test)', url: null, submitted_at: ts(-7, 10), score: 94, grade_comment: null, graded_at: ts(-4), created_at: ts(-7, 10) },
  { id: 'sub7', assignment_id: 'a13', student_id: 's-mina', body: 'Sketches of all four slides included.', url: null, submitted_at: ts(-4, 16), score: 18, grade_comment: 'Label magnification next time.', graded_at: ts(-2), created_at: ts(-4, 16) },
  // Late submission (submitted after due date, graded)
  { id: 'sub8', assignment_id: 'a13', student_id: 's-leo', body: 'Sorry — turned in late.', url: null, submitted_at: ts(-3, 22), score: 15, grade_comment: '-2 for late.', graded_at: ts(-2), created_at: ts(-3, 22) },
  { id: 'sub9', assignment_id: 'a14', student_id: 's-mina', body: 'Log attached: The Giver ch. 1–14.', url: null, submitted_at: ts(-5, 19), score: 10, grade_comment: null, graded_at: ts(-3), created_at: ts(-5, 19) },
  { id: 'sub10', assignment_id: 'a14', student_id: 's-zoe', body: 'Reading log complete.', url: null, submitted_at: ts(-5, 18), score: 9, grade_comment: null, graded_at: ts(-3), created_at: ts(-5, 18) },
  // Submitted, waiting for a grade — appears in SpeedGrader "needs grading"
  { id: 'sub11', assignment_id: 'a1', student_id: 's-zoe', body: 'Problems 1–20 attached. I used the quadratic formula for 15–20.', url: null, submitted_at: ts(0, 8), score: null, grade_comment: null, graded_at: null, created_at: ts(0, 8) },
  { id: 'sub12', assignment_id: 'a5', student_id: 's-mina', body: 'Draft: In "The Giver", memory functions as both burden and gift…', url: null, submitted_at: ts(0, 7), score: null, grade_comment: null, graded_at: null, created_at: ts(0, 7) },
  // (a14 for Leo… he isn't in English 10; Mina has no sub for a1 yet → unsubmitted)
];

export const demoAnnouncements: Announcement[] = [
  { id: 'an1', class_id: 'c-alg2', author_id: 't-anders', title: 'Unit 4 quiz moved to this week', body: 'Heads up — the Unit 4 quiz is open on the Quizzes tab through the due date. One attempt, 10 points. Calculators allowed.', created_at: ts(-1, 8) },
  { id: 'an2', class_id: 'c-alg2', author_id: 't-anders', title: 'Office hours this week', body: 'Extra help Tuesday and Thursday at lunch in Room 201. Bring your §4.3 questions!', created_at: ts(-3, 12) },
  { id: 'an3', class_id: 'c-bio', author_id: 't-chen', title: 'Lab safety reminder', body: 'Closed-toe shoes required for the osmosis lab. No exceptions — you will be sent to the library otherwise.', created_at: ts(-2, 9) },
  { id: 'an4', class_id: 'c-eng', author_id: 't-brooks', title: 'Essay drafts due soon', body: 'Your "Giver" theme drafts are due this week. I read every draft and give comments before the final. Turn in something, even if rough.', created_at: ts(-1, 14) },
  { id: 'an5', class_id: 'c-span', author_id: 't-diaz', title: '¡Bienvenidos!', body: 'Presentation sign-ups for the cultural project are posted on the door. First come, first served for countries.', created_at: ts(-4, 10) },
];

export const demoDiscussionTopics: DiscussionTopic[] = [
  { id: 'dt1', class_id: 'c-alg2', author_id: 't-anders', title: 'Where do you get stuck on word problems?', body: 'Post the step where quadratic word problems go wrong for you. Reply to at least one classmate with a suggestion.', created_at: ts(-3, 9) },
  { id: 'dt2', class_id: 'c-bio', author_id: 't-chen', title: 'Osmosis in real life', body: 'Share one everyday example of osmosis or diffusion you noticed this week.', created_at: ts(-2, 11) },
  { id: 'dt3', class_id: 'c-eng', author_id: 't-brooks', title: 'Is Jonas\'s community a utopia or dystopia?', body: 'Take a side and defend it with one quote from the first eight chapters.', created_at: ts(-4, 13) },
];

export const demoDiscussionPosts: DiscussionPost[] = [
  { id: 'dp1', topic_id: 'dt1', author_id: 's-mina', body: 'Setting up the equation from the words. Once it\'s written I can solve it fine.', created_at: ts(-2, 16) },
  { id: 'dp2', topic_id: 'dt1', author_id: 's-leo', body: 'Same as Mina — also knowing which solution to throw away (like negative lengths).', created_at: ts(-2, 18) },
  { id: 'dp3', topic_id: 'dt1', author_id: 's-zoe', body: '@Leo I circle the units in the problem first, it helps me pick the variable.', created_at: ts(-1, 7) },
  { id: 'dp4', topic_id: 'dt2', author_id: 's-mina', body: 'Salting cucumbers for kimchi — water comes right out of them!', created_at: ts(-1, 17) },
  { id: 'dp5', topic_id: 'dt3', author_id: 's-zoe', body: 'Dystopia. "We really have to protect people from wrong choices" shows they gave up freedom.', created_at: ts(-3, 15) },
];

// Quizlet-style practice quizzes made by students for their classmates.
export const demoPracticeQuizzes: PracticeQuiz[] = [
  { id: 'pq1', class_id: 'c-alg2', author_id: 's-mina', title: 'Quadratics self-check', description: 'Made this while studying for Unit 4 — good luck!', created_at: ts(-2, 19) },
  { id: 'pq2', class_id: 'c-alg2', author_id: 's-zoe', title: 'Factoring speed round', description: 'Quick factoring practice.', created_at: ts(-1, 20) },
  { id: 'pq3', class_id: 'c-bio', author_id: 's-leo', title: 'Cell organelles flashcards', description: 'Know your organelles for the quiz.', created_at: ts(-1, 18) },
  { id: 'pq4', class_id: 'c-eng', author_id: 's-zoe', title: 'Unit 5 vocab practice', description: null, created_at: ts(-3, 17) },
];

export const demoPracticeQuestions: PracticeQuestion[] = [
  // pq1 — Quadratics self-check (Mina)
  { id: 'pqq1', quiz_id: 'pq1', position: 1, question: 'What are the roots of x² − 5x + 6 = 0?', choices: ['x = 2, 3', 'x = −2, −3', 'x = 1, 6', 'x = −1, −6'], correct_index: 0 },
  { id: 'pqq2', quiz_id: 'pq1', position: 2, question: 'The discriminant of ax² + bx + c is…', choices: ['b² − 4ac', 'b² + 4ac', '−b ± 2ac', '4ac − b²'], correct_index: 0 },
  { id: 'pqq3', quiz_id: 'pq1', position: 3, question: 'If the discriminant is negative, the equation has…', choices: ['two real roots', 'one real root', 'no real roots', 'infinitely many roots'], correct_index: 2 },
  { id: 'pqq4', quiz_id: 'pq1', position: 4, question: 'The vertex of y = (x − 2)² + 5 is…', choices: ['(−2, 5)', '(2, −5)', '(2, 5)', '(5, 2)'], correct_index: 2 },
  // pq2 — Factoring speed round (Zoe)
  { id: 'pqq5', quiz_id: 'pq2', position: 1, question: 'Factor: x² − 9', choices: ['(x − 3)(x − 3)', '(x + 3)(x − 3)', '(x + 9)(x − 1)', 'prime'], correct_index: 1 },
  { id: 'pqq6', quiz_id: 'pq2', position: 2, question: 'Factor: x² + 5x + 6', choices: ['(x + 2)(x + 3)', '(x + 1)(x + 6)', '(x − 2)(x − 3)', '(x + 5)(x + 1)'], correct_index: 0 },
  { id: 'pqq7', quiz_id: 'pq2', position: 3, question: 'Factor: x² − 4x', choices: ['x(x − 4)', '(x − 2)(x + 2)', 'x(x + 4)', '4(x − 1)'], correct_index: 0 },
  // pq3 — Cell organelles (Leo)
  { id: 'pqq8', quiz_id: 'pq3', position: 1, question: 'Which organelle makes ATP?', choices: ['Nucleus', 'Ribosome', 'Mitochondrion', 'Vacuole'], correct_index: 2 },
  { id: 'pqq9', quiz_id: 'pq3', position: 2, question: 'Where are proteins built?', choices: ['Ribosome', 'Lysosome', 'Chloroplast', 'Cell wall'], correct_index: 0 },
  { id: 'pqq10', quiz_id: 'pq3', position: 3, question: 'Photosynthesis happens in the…', choices: ['Mitochondrion', 'Chloroplast', 'Nucleus', 'Membrane'], correct_index: 1 },
  // pq4 — Vocab (Zoe)
  { id: 'pqq11', quiz_id: 'pq4', position: 1, question: '"Ubiquitous" most nearly means…', choices: ['rare', 'everywhere', 'ancient', 'transparent'], correct_index: 1 },
  { id: 'pqq12', quiz_id: 'pq4', position: 2, question: '"Candid" most nearly means…', choices: ['sweet', 'hidden', 'honest', 'nervous'], correct_index: 2 },
  { id: 'pqq13', quiz_id: 'pq4', position: 3, question: '"Ephemeral" most nearly means…', choices: ['short-lived', 'heavenly', 'glowing', 'repeated'], correct_index: 0 },
];

export const demoModules: CourseModule[] = [
  { id: 'm1', class_id: 'c-alg2', name: 'Unit 4 — Quadratic Equations', position: 1 },
  { id: 'm2', class_id: 'c-alg2', name: 'Unit 3 — Polynomials (completed)', position: 2 },
  { id: 'm3', class_id: 'c-bio', name: 'Unit 2 — Cells', position: 1 },
];

export const demoModuleItems: ModuleItem[] = [
  { id: 'mi1', module_id: 'm1', position: 1, kind: 'header', ref_id: null, title: 'Learn', url: null },
  { id: 'mi2', module_id: 'm1', position: 2, kind: 'page', ref_id: 'p1', title: '', url: null },
  { id: 'mi3', module_id: 'm1', position: 3, kind: 'link', ref_id: null, title: 'Khan Academy: the quadratic formula', url: 'https://www.khanacademy.org/math/algebra' },
  { id: 'mi4', module_id: 'm1', position: 4, kind: 'header', ref_id: null, title: 'Practice & assess', url: null },
  { id: 'mi5', module_id: 'm1', position: 5, kind: 'assignment', ref_id: 'a1', title: '', url: null },
  { id: 'mi6', module_id: 'm1', position: 6, kind: 'assignment', ref_id: 'a2', title: '', url: null },
  { id: 'mi7', module_id: 'm2', position: 1, kind: 'assignment', ref_id: 'a11', title: '', url: null },
  { id: 'mi8', module_id: 'm2', position: 2, kind: 'assignment', ref_id: 'a12', title: '', url: null },
  { id: 'mi9', module_id: 'm3', position: 1, kind: 'page', ref_id: 'p2', title: '', url: null },
  { id: 'mi10', module_id: 'm3', position: 2, kind: 'assignment', ref_id: 'a3', title: '', url: null },
  { id: 'mi11', module_id: 'm3', position: 3, kind: 'assignment', ref_id: 'a4', title: '', url: null },
];

export const demoPages: WikiPage[] = [
  { id: 'p1', class_id: 'c-alg2', title: 'Solving quadratics — three methods', body: 'Every quadratic ax² + bx + c = 0 can be solved three ways:\n\n1. Factoring — fastest when the roots are integers. Look for two numbers that multiply to ac and add to b.\n\n2. Completing the square — turn the equation into (x + h)² = k, then take the square root of both sides.\n\n3. The quadratic formula — always works: x = (−b ± √(b² − 4ac)) / 2a. The discriminant b² − 4ac tells you how many real roots to expect.\n\nRule of thumb: try factoring for 15 seconds; if nothing jumps out, go straight to the formula.', updated_at: ts(-4), created_at: ts(-8) },
  { id: 'p2', class_id: 'c-bio', title: 'Cell organelles cheat sheet', body: 'Nucleus — control center, holds DNA.\nRibosome — builds proteins.\nMitochondrion — powerhouse; makes ATP.\nChloroplast — photosynthesis (plants only).\nCell membrane — controls what enters/leaves.\nCell wall — rigid support (plants only).\nVacuole — storage; one large one in plant cells.\nLysosome — recycling and waste breakdown.', updated_at: ts(-3), created_at: ts(-9) },
  { id: 'p3', class_id: 'c-eng', title: 'Essay formatting guide', body: 'MLA format: 12pt Times New Roman, double spaced, 1-inch margins.\n\nHeader: your name, my name, course, date — top left of page one.\n\nTitles of novels are italicized; short stories get quotation marks.\n\nEvery body paragraph: claim → evidence (quote) → analysis. The analysis should be at least twice as long as the quote.', updated_at: ts(-6), created_at: ts(-12) },
];

export const demoFiles: CourseFile[] = [
  { id: 'f1', class_id: 'c-alg2', name: 'unit4-formula-sheet.pdf', size_kb: 182, uploaded_by: 't-anders', created_at: ts(-5) },
  { id: 'f2', class_id: 'c-alg2', name: 'ch4-practice-answers.pdf', size_kb: 240, uploaded_by: 't-anders', created_at: ts(-2) },
  { id: 'f3', class_id: 'c-bio', name: 'osmosis-lab-handout.pdf', size_kb: 415, uploaded_by: 't-chen', created_at: ts(-3) },
  { id: 'f4', class_id: 'c-bio', name: 'cell-diagram-labeled.png', size_kb: 1024, uploaded_by: 't-chen', created_at: ts(-9) },
  { id: 'f5', class_id: 'c-eng', name: 'giver-discussion-questions.docx', size_kb: 88, uploaded_by: 't-brooks', created_at: ts(-4) },
];

export const demoConversations: Conversation[] = [
  { id: 'cv1', subject: 'Question about the Unit 4 quiz', participant_ids: ['s-mina', 't-anders'], created_at: ts(-1, 15) },
  { id: 'cv2', subject: 'Lab partner change request', participant_ids: ['s-leo', 't-chen'], created_at: ts(-2, 10) },
];

export const demoMessages: Message[] = [
  { id: 'msg1', conversation_id: 'cv1', sender_id: 's-mina', body: 'Hi Ms. Anderson — will the quiz cover completing the square, or just factoring and the formula?', created_at: ts(-1, 15) },
  { id: 'msg2', conversation_id: 'cv1', sender_id: 't-anders', body: 'Just factoring, the discriminant, and the formula. Completing the square comes on the unit test. Good luck!', created_at: ts(-1, 16) },
  { id: 'msg3', conversation_id: 'cv2', sender_id: 's-leo', body: 'Dr. Chen, could I switch lab partners for the osmosis lab? My partner moved to P4.', created_at: ts(-2, 10) },
];
