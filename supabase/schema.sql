-- ============================================================================
-- Homework Hub — Database schema
-- A homework/course hub: classes, assignments, announcements, class
-- discussions, student-made practice quizzes, files, and a personal calendar.
--
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query),
-- or via psql -f supabase/schema.sql
-- ============================================================================

drop table if exists guardianships cascade;
drop table if exists meeting_requests cascade;
drop table if exists counselor_slots cascade;
drop table if exists completions cascade;
drop table if exists calendar_events cascade;
drop table if exists files cascade;
drop table if exists practice_questions cascade;
drop table if exists practice_quizzes cascade;
drop table if exists discussion_posts cascade;
drop table if exists discussion_topics cascade;
drop table if exists announcements cascade;
drop table if exists assignments cascade;
drop table if exists enrollments cascade;
drop table if exists classes cascade;
drop table if exists profiles cascade;

-- People: students, teachers, admins ----------------------------------------
create table profiles (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  -- School email. Sign-in matches on this (see src/lib/auth.ts), so the office
  -- creates a person's profile ahead of time and they attach to the record
  -- that already has their classes. Nullable for anyone who never signs in.
  email      text unique,
  -- Whether the Sunday digest goes to this person. Opt-out rather than opt-in:
  -- the students who most need the reminder are the least likely to go looking
  -- for a setting to switch on.
  wants_digest boolean not null default true,
  role       text not null check (role in ('student', 'teacher', 'admin', 'counselor', 'parent')),
  grade      int  check (grade between 6 and 13),
  created_at timestamptz not null default now()
);
create index profiles_email_idx on profiles (lower(email));
create index profiles_role_idx on profiles (role);

-- The class catalog: a course taught by one teacher for a school year --------
create table classes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  subject     text not null,
  grade_level int,
  teacher_id  uuid not null references profiles (id) on delete cascade,
  period      text,
  room        text,
  school_year text not null,
  created_at  timestamptz not null default now()
);
create index classes_teacher_idx on classes (teacher_id);

-- Which students take which classes -----------------------------------------
create table enrollments (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles (id) on delete cascade,
  class_id   uuid not null references classes (id)  on delete cascade,
  created_at timestamptz not null default now(),
  unique (student_id, class_id)
);
create index enrollments_student_idx on enrollments (student_id);
create index enrollments_class_idx   on enrollments (class_id);

-- Links a guardian account to a student. Read-only by design: a parent sees
-- upcoming work and counseling meetings, and nothing else.
create table guardianships (
  id         uuid primary key default gen_random_uuid(),
  parent_id  uuid not null references profiles (id) on delete cascade,
  student_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (parent_id, student_id)
);
create index guardianships_parent_idx on guardianships (parent_id);

-- Homework / quizzes / tests / projects posted by teachers ------------------
create table assignments (
  id              uuid primary key default gen_random_uuid(),
  class_id        uuid not null references classes (id) on delete cascade,
  title           text not null,
  description     text,
  assigned_date   date not null default current_date,
  due_date        date not null,
  type            text not null default 'homework'
                    check (type in ('homework', 'quiz', 'test', 'project')),
  link            text,
  created_by      uuid references profiles (id) on delete set null,
  created_at      timestamptz not null default now()
);
create index assignments_class_idx on assignments (class_id);
create index assignments_due_idx   on assignments (due_date);

-- A student ticking their own checklist. Private to that student, never a
-- grade — the school system of record owns grading.
create table completions (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments (id) on delete cascade,
  student_id    uuid not null references profiles (id) on delete cascade,
  completed_at  timestamptz not null default now(),
  unique (assignment_id, student_id)
);
create index completions_student_idx on completions (student_id);

-- Class-wide announcements from the teacher -----------------------------------
create table announcements (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references classes (id) on delete cascade,
  author_id  uuid not null references profiles (id) on delete cascade,
  title      text not null,
  body       text not null,
  created_at timestamptz not null default now()
);
create index announcements_class_idx on announcements (class_id);

-- Threaded class discussions ----------------------------------------------------
create table discussion_topics (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references classes (id) on delete cascade,
  author_id  uuid not null references profiles (id) on delete cascade,
  title      text not null,
  body       text not null,
  created_at timestamptz not null default now()
);
create index discussion_topics_class_idx on discussion_topics (class_id);

create table discussion_posts (
  id         uuid primary key default gen_random_uuid(),
  topic_id   uuid not null references discussion_topics (id) on delete cascade,
  author_id  uuid not null references profiles (id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);
create index discussion_posts_topic_idx on discussion_posts (topic_id);

-- Quizlet-style practice quizzes: student-made, ungraded self-check ----------------
create table practice_quizzes (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references classes (id) on delete cascade,
  author_id   uuid not null references profiles (id) on delete cascade,
  title       text not null,
  description text,
  created_at  timestamptz not null default now()
);
create index practice_quizzes_class_idx on practice_quizzes (class_id);

create table practice_questions (
  id            uuid primary key default gen_random_uuid(),
  quiz_id       uuid not null references practice_quizzes (id) on delete cascade,
  position      int  not null default 1,
  question      text not null,
  choices       text[] not null,
  correct_index int  not null default 0
);
create index practice_questions_quiz_idx on practice_questions (quiz_id);
create unique index practice_questions_order_idx on practice_questions (quiz_id, position);

-- Course files. This table is the metadata; the bytes live in the Storage
-- bucket set up by storage.sql, at storage_path. Null means there is no object
-- behind the row (the sample rows in seed.sql), and the app won't offer it for
-- download.
create table files (
  id           uuid primary key default gen_random_uuid(),
  class_id     uuid not null references classes (id) on delete cascade,
  name         text not null,
  size_kb      int  not null default 0,
  storage_path text unique,
  uploaded_by  uuid not null references profiles (id) on delete cascade,
  created_at   timestamptz not null default now()
);
create index files_class_idx on files (class_id);

-- Times a counselor has said they're free. Students book one themselves, which
-- is the point: asking and then waiting to hear back is what made people give
-- up on talking to anyone. start_time is text because schools run on periods
-- and lunch waves ("Lunch A", "Period 5"), not clock times.
create table counselor_slots (
  id           uuid primary key default gen_random_uuid(),
  counselor_id uuid not null references profiles (id) on delete cascade,
  date         date not null,
  start_time   text not null,
  location     text,
  -- null = still open. Booking is a conditional update on this being null, so
  -- two students hitting "book" at once can't both win.
  booked_by    uuid references profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (counselor_id, date, start_time)
);
create index counselor_slots_open_idx on counselor_slots (counselor_id, date)
  where booked_by is null;

-- A student asking a counselor for time. Accepting one writes a calendar_events
-- row onto the student's calendar, so the answer lands where they will see it.
create table meeting_requests (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references profiles (id) on delete cascade,
  counselor_id uuid references profiles (id) on delete set null,
  reason       text not null,
  preferred    text,
  -- Set when the student booked one of the counselor's posted times themselves
  -- rather than asking for one.
  slot_id      uuid references counselor_slots (id) on delete set null,
  status       text not null default 'pending'
                 check (status in ('pending', 'accepted', 'declined')),
  response     text,
  created_at   timestamptz not null default now()
);
create index meeting_requests_student_idx on meeting_requests (student_id);
create index meeting_requests_status_idx on meeting_requests (status);

-- Calendar events: hand-added by a user, or a counselor meeting for a student.
-- owner_id is whose calendar it shows on; created_by is who added it.
create table calendar_events (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references profiles (id) on delete cascade,
  title      text not null,
  date       date not null,
  category   text not null default 'event'
               check (category in ('event', 'exam', 'reminder', 'personal', 'meeting', 'counseling')),
  note       text,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index calendar_events_owner_idx on calendar_events (owner_id);
create index calendar_events_creator_idx on calendar_events (created_by);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- These starting policies grant the anon key full access, which is what makes
-- the app explorable before anyone signs in. Once real accounts exist, run
-- rls-auth.sql to drop anon and leave signed-in users only.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'classes', 'enrollments', 'assignments', 'completions',
    'announcements', 'discussion_topics', 'discussion_posts',
    'practice_quizzes', 'practice_questions', 'files', 'calendar_events',
    'meeting_requests', 'counselor_slots', 'guardianships'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "pilot full access — %s" on %I for all to anon, authenticated using (true) with check (true)',
      t, t
    );
  end loop;
end $$;
