-- ============================================================================
-- Homework Hub — Seed data for the demo
-- Run AFTER schema.sql. Creates teachers, students, a class catalog,
-- enrollments, assignments, announcements, class discussions, student-made
-- practice quizzes, files, and personal calendar events so every tab has
-- content immediately.
-- ============================================================================

-- People --------------------------------------------------------------------
insert into profiles (id, name, role, grade) values
  ('00000000-0000-0000-0000-0000000000d1', 'Ms. Anderson', 'teacher', null),
  ('00000000-0000-0000-0000-0000000000d2', 'Mr. Brooks',   'teacher', null),
  ('00000000-0000-0000-0000-0000000000d3', 'Dr. Chen',     'teacher', null),
  ('00000000-0000-0000-0000-0000000000d4', 'Sr. Diaz',     'teacher', null),
  ('00000000-0000-0000-0000-0000000000e1', 'Mina (Student)', 'student', 10),
  ('00000000-0000-0000-0000-0000000000e2', 'Jay (Student)',  'student', 11),
  ('00000000-0000-0000-0000-0000000000e3', 'Leo (Student)',  'student', 10),
  ('00000000-0000-0000-0000-0000000000e4', 'Zoe (Student)',  'student', 10),
  ('00000000-0000-0000-0000-0000000000a1', 'School Office', 'admin', null);

-- Class catalog -------------------------------------------------------------
insert into classes (id, name, subject, grade_level, teacher_id, period, room, school_year, syllabus) values
  ('00000000-0000-0000-0000-0000000000c1', 'Algebra II',                  'Math',             10, '00000000-0000-0000-0000-0000000000d1', 'P1', '201',   '2026-2027', E'Welcome to Algebra II! This year we cover quadratics, polynomials, exponentials, logarithms, and an introduction to trigonometry.\n\nGrading: homework 30%, quizzes 30%, tests 30%, projects 10%.\nLate work loses 10% per day, up to 3 days. Retakes are available for quizzes below 70%.\n\nOffice hours: Tuesday & Thursday lunch, Room 201.'),
  ('00000000-0000-0000-0000-0000000000c2', 'AP Calculus AB',              'Math',             11, '00000000-0000-0000-0000-0000000000d1', 'P2', '201',   '2026-2027', null),
  ('00000000-0000-0000-0000-0000000000c3', 'Biology',                     'Science',          10, '00000000-0000-0000-0000-0000000000d3', 'P3', 'Lab A', '2026-2027', E'Biology is the study of living systems — cells, genetics, evolution, and ecology.\n\nExpect one lab per week; lab reports are due the following Monday. Safety contract must be signed before any lab work.\n\nGrading: labs 40%, quizzes/tests 40%, homework 20%.'),
  ('00000000-0000-0000-0000-0000000000c4', 'AP Chemistry',                'Science',          11, '00000000-0000-0000-0000-0000000000d3', 'P4', 'Lab B', '2026-2027', null),
  ('00000000-0000-0000-0000-0000000000c5', 'English 10',                  'English',          10, '00000000-0000-0000-0000-0000000000d2', 'P2', '110',   '2026-2027', null),
  ('00000000-0000-0000-0000-0000000000c6', 'AP English Literature',       'English',          11, '00000000-0000-0000-0000-0000000000d2', 'P5', '110',   '2026-2027', null),
  ('00000000-0000-0000-0000-0000000000c7', 'World History',               'History',          10, '00000000-0000-0000-0000-0000000000d2', 'P6', '115',   '2026-2027', null),
  ('00000000-0000-0000-0000-0000000000c8', 'Spanish III',                 'World Language',   10, '00000000-0000-0000-0000-0000000000d4', 'P1', '120',   '2026-2027', null),
  ('00000000-0000-0000-0000-0000000000c9', 'Intro to Computer Science',   'Computer Science', 10, '00000000-0000-0000-0000-0000000000d3', 'P7', 'Lab C', '2026-2027', null);

-- Enrollments -----------------------------------------------------------------
insert into enrollments (student_id, class_id) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000c1'),
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000c3'),
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000c5'),
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000c8'),
  ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000c1'),
  ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000c3'),
  ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000c9'),
  ('00000000-0000-0000-0000-0000000000e4', '00000000-0000-0000-0000-0000000000c1'),
  ('00000000-0000-0000-0000-0000000000e4', '00000000-0000-0000-0000-0000000000c5'),
  ('00000000-0000-0000-0000-0000000000e4', '00000000-0000-0000-0000-0000000000c7'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000c2'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000c4'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000c6');

-- Assignments (due dates relative to today so filters show content) ----------
insert into assignments (id, class_id, title, description, assigned_date, due_date, type, link, points_possible, submission_kind, created_by) values
  ('00000000-0000-0000-0000-00000000ab01', '00000000-0000-0000-0000-0000000000c1', 'Quadratics worksheet §4.3', 'Problems 1–20, show your work.', current_date - 2, current_date,      'homework', null, 20, 'text', '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-00000000ab02', '00000000-0000-0000-0000-0000000000c1', 'Unit 4 quiz', 'Covers factoring and the quadratic formula.', current_date - 5, current_date + 3,  'quiz',     null, 10, 'quiz', '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-00000000ab03', '00000000-0000-0000-0000-0000000000c3', 'Cell organelles reading', 'Read ch. 3 and answer the review questions.', current_date - 1, current_date + 1, 'homework', 'https://example.com/bio-ch3', 10, 'text', '00000000-0000-0000-0000-0000000000d3'),
  ('00000000-0000-0000-0000-00000000ab04', '00000000-0000-0000-0000-0000000000c3', 'Osmosis lab report', 'Full write-up: hypothesis, method, results, conclusion.', current_date - 3, current_date + 6, 'project', null, 50, 'text', '00000000-0000-0000-0000-0000000000d3'),
  ('00000000-0000-0000-0000-00000000ab05', '00000000-0000-0000-0000-0000000000c5', 'Essay draft: theme in "The Giver"', 'Two pages, double-spaced.', current_date - 4, current_date + 2, 'homework', null, 30, 'text', '00000000-0000-0000-0000-0000000000d2'),
  ('00000000-0000-0000-0000-00000000ab06', '00000000-0000-0000-0000-0000000000c5', 'Vocabulary test — Unit 5', null, current_date - 6, current_date + 9, 'test', null, 15, 'quiz', '00000000-0000-0000-0000-0000000000d2'),
  ('00000000-0000-0000-0000-00000000ab07', '00000000-0000-0000-0000-0000000000c8', 'Preterite vs. imperfect exercises', 'Cuaderno pp. 44–45.', current_date - 1, current_date + 4, 'homework', null, 20, 'text', '00000000-0000-0000-0000-0000000000d4'),
  ('00000000-0000-0000-0000-00000000ab08', '00000000-0000-0000-0000-0000000000c8', 'Cultural presentation', 'Pick a Spanish-speaking country; 3-minute talk.', current_date - 2, current_date + 20, 'project', null, 40, 'url', '00000000-0000-0000-0000-0000000000d4'),
  ('00000000-0000-0000-0000-00000000ab09', '00000000-0000-0000-0000-0000000000c2', 'Limits practice set', 'Problems 1–15.', current_date - 1, current_date + 2, 'homework', null, 15, 'text', '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-00000000ab10', '00000000-0000-0000-0000-0000000000c9', 'Python: number-guessing game', 'Push your code to the shared repo.', current_date - 2, current_date + 5, 'project', null, 25, 'url', '00000000-0000-0000-0000-0000000000d3'),
  -- Past work so Grades has history immediately
  ('00000000-0000-0000-0000-00000000ab11', '00000000-0000-0000-0000-0000000000c1', 'Factoring warm-up §4.1', 'Problems 1–12.', current_date - 10, current_date - 6, 'homework', null, 12, 'text', '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-00000000ab12', '00000000-0000-0000-0000-0000000000c1', 'Unit 3 test — polynomials', null, current_date - 14, current_date - 7, 'test', null, 100, 'text', '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-00000000ab13', '00000000-0000-0000-0000-0000000000c3', 'Microscope lab worksheet', 'Complete during lab.', current_date - 9, current_date - 4, 'homework', null, 20, 'text', '00000000-0000-0000-0000-0000000000d3'),
  ('00000000-0000-0000-0000-00000000ab14', '00000000-0000-0000-0000-0000000000c5', 'Reading log — weeks 1–2', null, current_date - 12, current_date - 5, 'homework', null, 10, 'text', '00000000-0000-0000-0000-0000000000d2');

-- Practice quizzes (Quizlet-style, made by students) --------------------------------
insert into practice_quizzes (id, class_id, author_id, title, description, created_at) values
  ('00000000-0000-0000-0000-00000000fb01', '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000e1', 'Quadratics self-check', 'Made this while studying for Unit 4 — good luck!', now() - interval '2 days'),
  ('00000000-0000-0000-0000-00000000fb02', '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000e4', 'Factoring speed round', 'Quick factoring practice.', now() - interval '1 day'),
  ('00000000-0000-0000-0000-00000000fb03', '00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000e3', 'Cell organelles flashcards', 'Know your organelles for the quiz.', now() - interval '1 day'),
  ('00000000-0000-0000-0000-00000000fb04', '00000000-0000-0000-0000-0000000000c5', '00000000-0000-0000-0000-0000000000e4', 'Unit 5 vocab practice', null, now() - interval '3 days');

insert into practice_questions (quiz_id, position, question, choices, correct_index) values
  ('00000000-0000-0000-0000-00000000fb01', 1, 'What are the roots of x² − 5x + 6 = 0?', array['x = 2, 3', 'x = −2, −3', 'x = 1, 6', 'x = −1, −6'], 0),
  ('00000000-0000-0000-0000-00000000fb01', 2, 'The discriminant of ax² + bx + c is…', array['b² − 4ac', 'b² + 4ac', '−b ± 2ac', '4ac − b²'], 0),
  ('00000000-0000-0000-0000-00000000fb01', 3, 'If the discriminant is negative, the equation has…', array['two real roots', 'one real root', 'no real roots', 'infinitely many roots'], 2),
  ('00000000-0000-0000-0000-00000000fb01', 4, 'The vertex of y = (x − 2)² + 5 is…', array['(−2, 5)', '(2, −5)', '(2, 5)', '(5, 2)'], 2),
  ('00000000-0000-0000-0000-00000000fb02', 1, 'Factor: x² − 9', array['(x − 3)(x − 3)', '(x + 3)(x − 3)', '(x + 9)(x − 1)', 'prime'], 1),
  ('00000000-0000-0000-0000-00000000fb02', 2, 'Factor: x² + 5x + 6', array['(x + 2)(x + 3)', '(x + 1)(x + 6)', '(x − 2)(x − 3)', '(x + 5)(x + 1)'], 0),
  ('00000000-0000-0000-0000-00000000fb02', 3, 'Factor: x² − 4x', array['x(x − 4)', '(x − 2)(x + 2)', 'x(x + 4)', '4(x − 1)'], 0),
  ('00000000-0000-0000-0000-00000000fb03', 1, 'Which organelle makes ATP?', array['Nucleus', 'Ribosome', 'Mitochondrion', 'Vacuole'], 2),
  ('00000000-0000-0000-0000-00000000fb03', 2, 'Where are proteins built?', array['Ribosome', 'Lysosome', 'Chloroplast', 'Cell wall'], 0),
  ('00000000-0000-0000-0000-00000000fb03', 3, 'Photosynthesis happens in the…', array['Mitochondrion', 'Chloroplast', 'Nucleus', 'Membrane'], 1),
  ('00000000-0000-0000-0000-00000000fb04', 1, '"Ubiquitous" most nearly means…', array['rare', 'everywhere', 'ancient', 'transparent'], 1),
  ('00000000-0000-0000-0000-00000000fb04', 2, '"Candid" most nearly means…', array['sweet', 'hidden', 'honest', 'nervous'], 2),
  ('00000000-0000-0000-0000-00000000fb04', 3, '"Ephemeral" most nearly means…', array['short-lived', 'heavenly', 'glowing', 'repeated'], 0);

-- Announcements ---------------------------------------------------------------------
insert into announcements (class_id, author_id, title, body, created_at) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000d1', 'Unit 4 quiz moved to this week', 'Heads up — the Unit 4 quiz is open on the Quizzes tab through the due date. One attempt, 10 points. Calculators allowed.', now() - interval '1 day'),
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000d1', 'Office hours this week', 'Extra help Tuesday and Thursday at lunch in Room 201. Bring your §4.3 questions!', now() - interval '3 days'),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000d3', 'Lab safety reminder', 'Closed-toe shoes required for the osmosis lab. No exceptions — you will be sent to the library otherwise.', now() - interval '2 days'),
  ('00000000-0000-0000-0000-0000000000c5', '00000000-0000-0000-0000-0000000000d2', 'Essay drafts due soon', 'Your "Giver" theme drafts are due this week. I read every draft and give comments before the final. Turn in something, even if rough.', now() - interval '1 day'),
  ('00000000-0000-0000-0000-0000000000c8', '00000000-0000-0000-0000-0000000000d4', '¡Bienvenidos!', 'Presentation sign-ups for the cultural project are posted on the door. First come, first served for countries.', now() - interval '4 days');

-- Discussions --------------------------------------------------------------------------
insert into discussion_topics (id, class_id, author_id, title, body, created_at) values
  ('00000000-0000-0000-0000-00000000dd01', '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000d1', 'Where do you get stuck on word problems?', 'Post the step where quadratic word problems go wrong for you. Reply to at least one classmate with a suggestion.', now() - interval '3 days'),
  ('00000000-0000-0000-0000-00000000dd02', '00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000d3', 'Osmosis in real life', 'Share one everyday example of osmosis or diffusion you noticed this week.', now() - interval '2 days'),
  ('00000000-0000-0000-0000-00000000dd03', '00000000-0000-0000-0000-0000000000c5', '00000000-0000-0000-0000-0000000000d2', 'Is Jonas''s community a utopia or dystopia?', 'Take a side and defend it with one quote from the first eight chapters.', now() - interval '4 days'),
  ('00000000-0000-0000-0000-00000000dd04', '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000e4', 'Study group for the Unit 4 quiz?', 'Anyone want to meet in the library Thursday to review factoring and the quadratic formula?', now() - interval '1 day'),
  ('00000000-0000-0000-0000-00000000dd05', '00000000-0000-0000-0000-0000000000c8', '00000000-0000-0000-0000-0000000000e1', 'Preterite vs imperfect — any tricks?', 'I keep mixing these up. How do you remember which one to use?', now() - interval '2 hours');

insert into discussion_posts (topic_id, author_id, body, created_at) values
  ('00000000-0000-0000-0000-00000000dd01', '00000000-0000-0000-0000-0000000000e1', 'Setting up the equation from the words. Once it''s written I can solve it fine.', now() - interval '2 days'),
  ('00000000-0000-0000-0000-00000000dd01', '00000000-0000-0000-0000-0000000000e3', 'Same as Mina — also knowing which solution to throw away (like negative lengths).', now() - interval '2 days'),
  ('00000000-0000-0000-0000-00000000dd01', '00000000-0000-0000-0000-0000000000e4', '@Leo I circle the units in the problem first, it helps me pick the variable.', now() - interval '1 day'),
  ('00000000-0000-0000-0000-00000000dd02', '00000000-0000-0000-0000-0000000000e1', 'Salting cucumbers for kimchi — water comes right out of them!', now() - interval '1 day'),
  ('00000000-0000-0000-0000-00000000dd03', '00000000-0000-0000-0000-0000000000e4', 'Dystopia. "We really have to protect people from wrong choices" shows they gave up freedom.', now() - interval '3 days'),
  ('00000000-0000-0000-0000-00000000dd04', '00000000-0000-0000-0000-0000000000e3', 'I''m in! Thursday after 6th period works.', now() - interval '20 hours'),
  ('00000000-0000-0000-0000-00000000dd04', '00000000-0000-0000-0000-0000000000e1', 'Same, count me in. I''ll bring the practice quiz I made.', now() - interval '4 hours');

-- Files (metadata only) -----------------------------------------------------------------
insert into files (class_id, name, size_kb, uploaded_by) values
  ('00000000-0000-0000-0000-0000000000c1', 'unit4-formula-sheet.pdf', 182, '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-0000000000c1', 'ch4-practice-answers.pdf', 240, '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-0000000000c3', 'osmosis-lab-handout.pdf', 415, '00000000-0000-0000-0000-0000000000d3'),
  ('00000000-0000-0000-0000-0000000000c3', 'cell-diagram-labeled.png', 1024, '00000000-0000-0000-0000-0000000000d3'),
  ('00000000-0000-0000-0000-0000000000c5', 'giver-discussion-questions.docx', 88, '00000000-0000-0000-0000-0000000000d2');

-- Personal calendar events (Mina's, added by hand) ---------------------------------------
insert into calendar_events (owner_id, title, date, category, note) values
  ('00000000-0000-0000-0000-0000000000e1', 'Dentist appointment', current_date + 1, 'personal', '3:30pm — leave right after school'),
  ('00000000-0000-0000-0000-0000000000e1', 'Study group (library)', current_date + 2, 'meeting', 'Unit 4 quiz review with Leo & Zoe'),
  ('00000000-0000-0000-0000-0000000000e1', 'Soccer practice', current_date + 3, 'event', null),
  ('00000000-0000-0000-0000-0000000000e1', 'Turn in permission slip', current_date, 'reminder', 'For the museum field trip');
