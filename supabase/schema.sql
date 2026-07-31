-- ============================================================================
-- Homework Hub — Database schema
-- A homework/course hub: classes, assignments, announcements, class
-- discussions, student-made practice quizzes, files, and a personal calendar.
--
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query),
-- or via psql -f supabase/schema.sql
-- ============================================================================

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
  role       text not null check (role in ('student', 'teacher', 'admin', 'counselor')),
  grade      int  check (grade between 6 and 13),
  created_at timestamptz not null default now()
);
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

-- Course files (metadata only; storage buckets come in a later phase) ----------------
create table files (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references classes (id) on delete cascade,
  name        text not null,
  size_kb     int  not null default 0,
  uploaded_by uuid not null references profiles (id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index files_class_idx on files (class_id);

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
-- Pilot runs on the public anon key (no per-user auth yet), so anon gets full
-- access. When Supabase Auth is added, tighten these to per-user rules
-- (e.g. students edit only their own posts; teachers only their classes).
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'classes', 'enrollments', 'assignments', 'completions',
    'announcements', 'discussion_topics', 'discussion_posts',
    'practice_quizzes', 'practice_questions', 'files', 'calendar_events'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "pilot full access — %s" on %I for all to anon, authenticated using (true) with check (true)',
      t, t
    );
  end loop;
end $$;
