-- ============================================================================
-- Homework Hub — Seed data for the demo
-- Run AFTER schema.sql. Creates teachers, students, a counselor, a class
-- catalog, enrollments, assignments, announcements, class discussions,
-- student-made practice quizzes, files, and calendar events so every tab has
-- content immediately.
--
-- Keep this in sync with src/lib/demoData.ts, which mirrors it for demo mode.
-- ============================================================================

-- People --------------------------------------------------------------------
-- Emails are what sign-in matches on. Replace these with real school
-- addresses before a pilot; @school.example is reserved for examples and can
-- never receive a magic link.
insert into profiles (id, name, email, role, grade) values
  ('00000000-0000-0000-0000-0000000000d1', 'Ms. Anderson', 'anderson@school.example', 'teacher', null),
  ('00000000-0000-0000-0000-0000000000d2', 'Mr. Brooks',   'brooks@school.example',   'teacher', null),
  ('00000000-0000-0000-0000-0000000000d3', 'Dr. Chen',     'chen@school.example',     'teacher', null),
  ('00000000-0000-0000-0000-0000000000d4', 'Sr. Diaz',     'diaz@school.example',     'teacher', null),
  ('00000000-0000-0000-0000-0000000000e1', 'Mina (Student)', 'mina@school.example', 'student', 10),
  ('00000000-0000-0000-0000-0000000000e2', 'Jay (Student)',  'jay@school.example',  'student', 11),
  ('00000000-0000-0000-0000-0000000000e3', 'Leo (Student)',  'leo@school.example',  'student', 10),
  ('00000000-0000-0000-0000-0000000000e4', 'Zoe (Student)',  'zoe@school.example',  'student', 10),
  ('00000000-0000-0000-0000-0000000000b1', 'Ms. Rivera (Counselor)', 'rivera@school.example', 'counselor', null),
  ('00000000-0000-0000-0000-0000000000f1', 'Mrs. Kim (Parent)', 'kim.family@school.example', 'parent', null),
  ('00000000-0000-0000-0000-0000000000a1', 'School Office', 'office@school.example', 'admin', null);

-- Class catalog -------------------------------------------------------------
insert into classes (id, name, subject, grade_level, teacher_id, period, room, school_year) values
  ('00000000-0000-0000-0000-0000000000c1', 'Algebra II',                'Math',             10, '00000000-0000-0000-0000-0000000000d1', 'P1', '201',   '2026-2027'),
  ('00000000-0000-0000-0000-0000000000c2', 'AP Calculus AB',            'Math',             11, '00000000-0000-0000-0000-0000000000d1', 'P2', '201',   '2026-2027'),
  ('00000000-0000-0000-0000-0000000000c3', 'Biology',                   'Science',          10, '00000000-0000-0000-0000-0000000000d3', 'P3', 'Lab A', '2026-2027'),
  ('00000000-0000-0000-0000-0000000000c4', 'AP Chemistry',              'Science',          11, '00000000-0000-0000-0000-0000000000d3', 'P4', 'Lab B', '2026-2027'),
  ('00000000-0000-0000-0000-0000000000c5', 'English 10',                'English',          10, '00000000-0000-0000-0000-0000000000d2', 'P2', '110',   '2026-2027'),
  ('00000000-0000-0000-0000-0000000000c6', 'AP English Literature',     'English',          11, '00000000-0000-0000-0000-0000000000d2', 'P5', '110',   '2026-2027'),
  ('00000000-0000-0000-0000-0000000000c7', 'World History',             'History',          10, '00000000-0000-0000-0000-0000000000d2', 'P6', '115',   '2026-2027'),
  ('00000000-0000-0000-0000-0000000000c8', 'Spanish III',               'World Language',   10, '00000000-0000-0000-0000-0000000000d4', 'P1', '120',   '2026-2027'),
  ('00000000-0000-0000-0000-0000000000c9', 'Intro to Computer Science', 'Computer Science', 10, '00000000-0000-0000-0000-0000000000d3', 'P7', 'Lab C', '2026-2027');

-- Enrollments ----------------------------------------------------------------
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

-- Guardian links --------------------------------------------------------------
insert into guardianships (parent_id, student_id) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1');

-- Assignments (due dates relative to today so filters show content) ----------
insert into assignments (id, class_id, title, description, assigned_date, due_date, type, link, created_by) values
  ('00000000-0000-0000-0000-00000000ab01', '00000000-0000-0000-0000-0000000000c1', 'Quadratics worksheet §4.3', 'Problems 1–20, show your work.', current_date - 2, current_date,      'homework', null, '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-00000000ab02', '00000000-0000-0000-0000-0000000000c1', 'Unit 4 quiz', 'Covers factoring and the quadratic formula.', current_date - 5, current_date + 3, 'quiz', null, '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-00000000ab03', '00000000-0000-0000-0000-0000000000c3', 'Cell organelles reading', 'Read ch. 3 and answer the review questions.', current_date - 1, current_date + 1, 'homework', 'https://example.com/bio-ch3', '00000000-0000-0000-0000-0000000000d3'),
  ('00000000-0000-0000-0000-00000000ab04', '00000000-0000-0000-0000-0000000000c3', 'Osmosis lab report', 'Full write-up: hypothesis, method, results, conclusion.', current_date - 3, current_date + 6, 'project', null, '00000000-0000-0000-0000-0000000000d3'),
  ('00000000-0000-0000-0000-00000000ab05', '00000000-0000-0000-0000-0000000000c5', 'Essay draft: theme in "The Giver"', 'Two pages, double-spaced.', current_date - 4, current_date + 2, 'homework', null, '00000000-0000-0000-0000-0000000000d2'),
  ('00000000-0000-0000-0000-00000000ab06', '00000000-0000-0000-0000-0000000000c5', 'Vocabulary test — Unit 5', null, current_date - 6, current_date + 9, 'test', null, '00000000-0000-0000-0000-0000000000d2'),
  ('00000000-0000-0000-0000-00000000ab07', '00000000-0000-0000-0000-0000000000c8', 'Preterite vs. imperfect exercises', 'Cuaderno pp. 44–45.', current_date - 1, current_date + 4, 'homework', null, '00000000-0000-0000-0000-0000000000d4'),
  ('00000000-0000-0000-0000-00000000ab08', '00000000-0000-0000-0000-0000000000c8', 'Cultural presentation', 'Pick a Spanish-speaking country; 3-minute talk.', current_date - 2, current_date + 20, 'project', null, '00000000-0000-0000-0000-0000000000d4'),
  ('00000000-0000-0000-0000-00000000ab09', '00000000-0000-0000-0000-0000000000c2', 'Limits practice set', 'Problems 1–15.', current_date - 1, current_date + 2, 'homework', null, '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-00000000ab10', '00000000-0000-0000-0000-0000000000c9', 'Python: number-guessing game', 'Push your code to the shared repo.', current_date - 2, current_date + 5, 'project', null, '00000000-0000-0000-0000-0000000000d3'),
  -- Past-due work so the "Past" section and overdue styling have content on load
  ('00000000-0000-0000-0000-00000000ab11', '00000000-0000-0000-0000-0000000000c1', 'Factoring warm-up §4.1', 'Problems 1–12.', current_date - 10, current_date - 6, 'homework', null, '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-00000000ab12', '00000000-0000-0000-0000-0000000000c1', 'Unit 3 test — polynomials', null, current_date - 14, current_date - 7, 'test', null, '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-00000000ab13', '00000000-0000-0000-0000-0000000000c3', 'Microscope lab worksheet', 'Complete during lab.', current_date - 9, current_date - 4, 'homework', null, '00000000-0000-0000-0000-0000000000d3'),
  ('00000000-0000-0000-0000-00000000ab14', '00000000-0000-0000-0000-0000000000c5', 'Reading log — weeks 1–2', null, current_date - 12, current_date - 5, 'homework', null, '00000000-0000-0000-0000-0000000000d2');

-- A few things students have already ticked off their own lists ---------------
insert into completions (assignment_id, student_id, completed_at) values
  ('00000000-0000-0000-0000-00000000ab11', '00000000-0000-0000-0000-0000000000e1', now() - interval '7 days'),
  ('00000000-0000-0000-0000-00000000ab12', '00000000-0000-0000-0000-0000000000e1', now() - interval '8 days'),
  ('00000000-0000-0000-0000-00000000ab13', '00000000-0000-0000-0000-0000000000e1', now() - interval '5 days'),
  ('00000000-0000-0000-0000-00000000ab03', '00000000-0000-0000-0000-0000000000e1', now() - interval '2 hours'),
  ('00000000-0000-0000-0000-00000000ab11', '00000000-0000-0000-0000-0000000000e3', now() - interval '6 days');

-- Practice quizzes (Quizlet-style, made by students) --------------------------
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
  -- Same card as fb01's #2: two students wrote it independently, which is why
  -- the class bank de-duplicates before a study round.
  ('00000000-0000-0000-0000-00000000fb02', 4, 'The discriminant of ax² + bx + c is…', array['b² − 4ac', '2ac − b', 'b² + 4ac', 'ac − b²'], 0),
  ('00000000-0000-0000-0000-00000000fb03', 1, 'Which organelle makes ATP?', array['Nucleus', 'Ribosome', 'Mitochondrion', 'Vacuole'], 2),
  ('00000000-0000-0000-0000-00000000fb03', 2, 'Where are proteins built?', array['Ribosome', 'Lysosome', 'Chloroplast', 'Cell wall'], 0),
  ('00000000-0000-0000-0000-00000000fb03', 3, 'Photosynthesis happens in the…', array['Mitochondrion', 'Chloroplast', 'Nucleus', 'Membrane'], 1),
  ('00000000-0000-0000-0000-00000000fb04', 1, '"Ubiquitous" most nearly means…', array['rare', 'everywhere', 'ancient', 'transparent'], 1),
  ('00000000-0000-0000-0000-00000000fb04', 2, '"Candid" most nearly means…', array['sweet', 'hidden', 'honest', 'nervous'], 2),
  ('00000000-0000-0000-0000-00000000fb04', 3, '"Ephemeral" most nearly means…', array['short-lived', 'heavenly', 'glowing', 'repeated'], 0);

-- Announcements ---------------------------------------------------------------
insert into announcements (class_id, author_id, title, body, created_at) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000d1', 'Unit 4 quiz moved to this week', 'Heads up — the Unit 4 quiz is this week. One attempt, calculators allowed.', now() - interval '1 day'),
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000d1', 'Office hours this week', 'Extra help Tuesday and Thursday at lunch in Room 201. Bring your §4.3 questions!', now() - interval '3 days'),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000d3', 'Lab safety reminder', 'Closed-toe shoes required for the osmosis lab. No exceptions — you will be sent to the library otherwise.', now() - interval '2 days'),
  ('00000000-0000-0000-0000-0000000000c5', '00000000-0000-0000-0000-0000000000d2', 'Essay drafts due soon', 'Your "Giver" theme drafts are due this week. Turn in something, even if rough.', now() - interval '1 day'),
  ('00000000-0000-0000-0000-0000000000c8', '00000000-0000-0000-0000-0000000000d4', '¡Bienvenidos!', 'Presentation sign-ups for the cultural project are posted on the door. First come, first served for countries.', now() - interval '4 days');

-- Discussions ------------------------------------------------------------------
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

-- Files (metadata only) --------------------------------------------------------
insert into files (class_id, name, size_kb, uploaded_by) values
  ('00000000-0000-0000-0000-0000000000c1', 'unit4-formula-sheet.pdf', 182, '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-0000000000c1', 'ch4-practice-answers.pdf', 240, '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-0000000000c3', 'osmosis-lab-handout.pdf', 415, '00000000-0000-0000-0000-0000000000d3'),
  ('00000000-0000-0000-0000-0000000000c3', 'cell-diagram-labeled.png', 1024, '00000000-0000-0000-0000-0000000000d3'),
  ('00000000-0000-0000-0000-0000000000c5', 'giver-discussion-questions.docx', 88, '00000000-0000-0000-0000-0000000000d2');

-- Meeting requests waiting on the counselor ----------------------------------
insert into meeting_requests (student_id, counselor_id, reason, preferred, status, created_at) values
  ('00000000-0000-0000-0000-0000000000e4', '00000000-0000-0000-0000-0000000000b1', 'Questions about signing up for AP classes next year', 'Any lunch period this week', 'pending', now() - interval '1 day'),
  ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000b1', 'Need to talk about my schedule', null, 'accepted', now() - interval '6 days');

-- Calendar events: students' own entries + counseling meetings Ms. Rivera set ---
insert into calendar_events (owner_id, title, date, category, note, created_by) values
  ('00000000-0000-0000-0000-0000000000e1', 'Dentist appointment', current_date + 1, 'personal', '3:30pm — leave right after school', '00000000-0000-0000-0000-0000000000e1'),
  ('00000000-0000-0000-0000-0000000000e1', 'Study group (library)', current_date + 2, 'meeting', 'Unit 4 quiz review with Leo & Zoe', '00000000-0000-0000-0000-0000000000e1'),
  ('00000000-0000-0000-0000-0000000000e1', 'Soccer practice', current_date + 3, 'event', null, '00000000-0000-0000-0000-0000000000e1'),
  ('00000000-0000-0000-0000-0000000000e1', 'Turn in permission slip', current_date, 'reminder', 'For the museum field trip', '00000000-0000-0000-0000-0000000000e1'),
  ('00000000-0000-0000-0000-0000000000e1', 'Counselor check-in — Ms. Rivera', current_date + 5, 'counseling', 'College application timeline. Room 102, 11:15am.', '00000000-0000-0000-0000-0000000000b1'),
  ('00000000-0000-0000-0000-0000000000e3', 'Counselor check-in — Ms. Rivera', current_date + 4, 'counseling', 'Course selection for next year.', '00000000-0000-0000-0000-0000000000b1');
