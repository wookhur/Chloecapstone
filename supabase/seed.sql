-- ============================================================================
-- Homework Hub — Seed data for the demo
-- Run AFTER schema.sql. Creates teachers, students, a class catalog, one
-- student's enrollments, and assignments due around "today" so the feed and
-- calendar have content immediately.
-- ============================================================================

-- People --------------------------------------------------------------------
insert into profiles (id, name, role, grade) values
  ('00000000-0000-0000-0000-0000000000d1', 'Ms. Anderson', 'teacher', null),
  ('00000000-0000-0000-0000-0000000000d2', 'Mr. Brooks',   'teacher', null),
  ('00000000-0000-0000-0000-0000000000d3', 'Dr. Chen',     'teacher', null),
  ('00000000-0000-0000-0000-0000000000d4', 'Sr. Diaz',     'teacher', null),
  ('00000000-0000-0000-0000-0000000000e1', 'Mina (Student)', 'student', 10),
  ('00000000-0000-0000-0000-0000000000e2', 'Jay (Student)',  'student', 11),
  ('00000000-0000-0000-0000-0000000000a1', 'School Office', 'admin', null);

-- Class catalog -------------------------------------------------------------
insert into classes (id, name, subject, grade_level, teacher_id, period, room, school_year) values
  ('00000000-0000-0000-0000-0000000000c1', 'Algebra II',                  'Math',             10, '00000000-0000-0000-0000-0000000000d1', 'P1', '201',   '2026-2027'),
  ('00000000-0000-0000-0000-0000000000c2', 'AP Calculus AB',              'Math',             11, '00000000-0000-0000-0000-0000000000d1', 'P2', '201',   '2026-2027'),
  ('00000000-0000-0000-0000-0000000000c3', 'Biology',                     'Science',          10, '00000000-0000-0000-0000-0000000000d3', 'P3', 'Lab A', '2026-2027'),
  ('00000000-0000-0000-0000-0000000000c4', 'AP Chemistry',                'Science',          11, '00000000-0000-0000-0000-0000000000d3', 'P4', 'Lab B', '2026-2027'),
  ('00000000-0000-0000-0000-0000000000c5', 'English 10',                  'English',          10, '00000000-0000-0000-0000-0000000000d2', 'P2', '110',   '2026-2027'),
  ('00000000-0000-0000-0000-0000000000c6', 'AP English Literature',       'English',          11, '00000000-0000-0000-0000-0000000000d2', 'P5', '110',   '2026-2027'),
  ('00000000-0000-0000-0000-0000000000c7', 'World History',               'History',          10, '00000000-0000-0000-0000-0000000000d2', 'P6', '115',   '2026-2027'),
  ('00000000-0000-0000-0000-0000000000c8', 'Spanish III',                 'World Language',   10, '00000000-0000-0000-0000-0000000000d4', 'P1', '120',   '2026-2027'),
  ('00000000-0000-0000-0000-0000000000c9', 'Intro to Computer Science',   'Computer Science', 10, '00000000-0000-0000-0000-0000000000d3', 'P7', 'Lab C', '2026-2027');

-- Mina's enrollments --------------------------------------------------------
insert into enrollments (student_id, class_id) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000c1'),
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000c3'),
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000c5'),
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000c8');

-- Assignments (due dates relative to today so filters show content) ----------
insert into assignments (class_id, title, description, assigned_date, due_date, type, link, created_by) values
  ('00000000-0000-0000-0000-0000000000c1', 'Quadratics worksheet §4.3', 'Problems 1–20, show your work.', current_date - 2, current_date,      'homework', null, '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-0000000000c1', 'Unit 4 quiz', 'Covers factoring and the quadratic formula.', current_date - 5, current_date + 3,  'quiz',     null, '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-0000000000c3', 'Cell organelles reading', 'Read ch. 3 and answer the review questions.', current_date - 1, current_date + 1, 'homework', 'https://example.com/bio-ch3', '00000000-0000-0000-0000-0000000000d3'),
  ('00000000-0000-0000-0000-0000000000c3', 'Osmosis lab report', 'Full write-up: hypothesis, method, results, conclusion.', current_date - 3, current_date + 6, 'project', null, '00000000-0000-0000-0000-0000000000d3'),
  ('00000000-0000-0000-0000-0000000000c5', 'Essay draft: theme in "The Giver"', 'Two pages, double-spaced.', current_date - 4, current_date + 2, 'homework', null, '00000000-0000-0000-0000-0000000000d2'),
  ('00000000-0000-0000-0000-0000000000c5', 'Vocabulary test — Unit 5', null, current_date - 6, current_date + 9, 'test', null, '00000000-0000-0000-0000-0000000000d2'),
  ('00000000-0000-0000-0000-0000000000c8', 'Preterite vs. imperfect exercises', 'Cuaderno pp. 44–45.', current_date - 1, current_date + 4, 'homework', null, '00000000-0000-0000-0000-0000000000d4'),
  ('00000000-0000-0000-0000-0000000000c8', 'Cultural presentation', 'Pick a Spanish-speaking country; 3-minute talk.', current_date - 2, current_date + 20, 'project', null, '00000000-0000-0000-0000-0000000000d4'),
  ('00000000-0000-0000-0000-0000000000c2', 'Limits practice set', 'Problems 1–15.', current_date - 1, current_date + 2, 'homework', null, '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-0000000000c9', 'Python: number-guessing game', 'Push your code to the shared repo.', current_date - 2, current_date + 5, 'project', null, '00000000-0000-0000-0000-0000000000d3');
