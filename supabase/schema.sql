-- ============================================================================
-- Homework Hub — Database schema
-- Students pick classes; teachers post homework; everyone sees a feed + calendar.
--
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query),
-- or via psql -f supabase/schema.sql
-- ============================================================================

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
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid not null references classes (id) on delete cascade,
  title         text not null,
  description   text,
  assigned_date date not null default current_date,
  due_date      date not null,
  type          text not null default 'homework'
                  check (type in ('homework', 'quiz', 'test', 'project')),
  link          text,
  created_by    uuid references profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index assignments_class_idx on assignments (class_id);
create index assignments_due_idx   on assignments (due_date);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Pilot runs on the public anon key (no per-user auth yet), so anon gets full
-- access. When Supabase Auth is added, tighten these to per-user rules
-- (e.g. students edit only their own enrollments; teachers only their classes).
-- ---------------------------------------------------------------------------
alter table profiles    enable row level security;
alter table classes     enable row level security;
alter table enrollments enable row level security;
alter table assignments enable row level security;

create policy "pilot full access — profiles"    on profiles    for all to anon, authenticated using (true) with check (true);
create policy "pilot full access — classes"     on classes     for all to anon, authenticated using (true) with check (true);
create policy "pilot full access — enrollments" on enrollments for all to anon, authenticated using (true) with check (true);
create policy "pilot full access — assignments" on assignments for all to anon, authenticated using (true) with check (true);
