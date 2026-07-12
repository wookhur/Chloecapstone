-- ============================================================================
-- Homework Hub — Database schema
-- A Canvas-style LMS: classes, assignments with submissions & grades,
-- announcements, discussions, quizzes, modules, pages, files, and inbox.
--
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query),
-- or via psql -f supabase/schema.sql
-- ============================================================================

drop table if exists messages cascade;
drop table if exists conversations cascade;
drop table if exists files cascade;
drop table if exists pages cascade;
drop table if exists module_items cascade;
drop table if exists modules cascade;
drop table if exists quiz_questions cascade;
drop table if exists discussion_posts cascade;
drop table if exists discussion_topics cascade;
drop table if exists announcements cascade;
drop table if exists submissions cascade;
drop table if exists assignments cascade;
drop table if exists enrollments cascade;
drop table if exists classes cascade;
drop table if exists profiles cascade;

-- People: students, teachers, admins ----------------------------------------
create table profiles (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  role       text not null check (role in ('student', 'teacher', 'admin')),
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
  syllabus    text,
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
  points_possible numeric not null default 10,
  submission_kind text not null default 'text'
                    check (submission_kind in ('text', 'url', 'none', 'quiz')),
  published       boolean not null default true,
  created_by      uuid references profiles (id) on delete set null,
  created_at      timestamptz not null default now()
);
create index assignments_class_idx on assignments (class_id);
create index assignments_due_idx   on assignments (due_date);

-- Student submissions + grades (one row per student per assignment) ----------
create table submissions (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments (id) on delete cascade,
  student_id    uuid not null references profiles (id) on delete cascade,
  body          text,           -- text entry, or JSON quiz answers
  url           text,           -- website-URL submissions
  submitted_at  timestamptz,
  score         numeric,
  grade_comment text,
  graded_at     timestamptz,
  created_at    timestamptz not null default now(),
  unique (assignment_id, student_id)
);
create index submissions_assignment_idx on submissions (assignment_id);
create index submissions_student_idx    on submissions (student_id);

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

-- Auto-graded multiple-choice questions for quiz-type assignments -----------------
create table quiz_questions (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments (id) on delete cascade,
  position      int  not null default 1,
  question      text not null,
  choices       text[] not null,
  correct_index int  not null default 0,
  points        numeric not null default 1
);
create index quiz_questions_assignment_idx on quiz_questions (assignment_id);

-- Course modules: ordered units of pages / assignments / links --------------------
create table modules (
  id       uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes (id) on delete cascade,
  name     text not null,
  position int  not null default 1
);
create index modules_class_idx on modules (class_id);

create table module_items (
  id        uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules (id) on delete cascade,
  position  int  not null default 1,
  kind      text not null check (kind in ('assignment', 'page', 'link', 'header')),
  ref_id    uuid,           -- assignment or page id (kind-dependent)
  title     text not null default '',
  url       text
);
create index module_items_module_idx on module_items (module_id);

-- Wiki-style course content pages ----------------------------------------------------
create table pages (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references classes (id) on delete cascade,
  title      text not null,
  body       text not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index pages_class_idx on pages (class_id);

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

-- Inbox: conversations + messages ------------------------------------------------------
create table conversations (
  id              uuid primary key default gen_random_uuid(),
  subject         text not null,
  participant_ids uuid[] not null,
  created_at      timestamptz not null default now()
);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender_id       uuid not null references profiles (id) on delete cascade,
  body            text not null,
  created_at      timestamptz not null default now()
);
create index messages_conversation_idx on messages (conversation_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Pilot runs on the public anon key (no per-user auth yet), so anon gets full
-- access. When Supabase Auth is added, tighten these to per-user rules
-- (e.g. students edit only their own submissions; teachers only their classes).
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'classes', 'enrollments', 'assignments', 'submissions',
    'announcements', 'discussion_topics', 'discussion_posts', 'quiz_questions',
    'modules', 'module_items', 'pages', 'files', 'conversations', 'messages'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "pilot full access — %s" on %I for all to anon, authenticated using (true) with check (true)',
      t, t
    );
  end loop;
end $$;
