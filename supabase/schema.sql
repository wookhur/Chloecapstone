-- ============================================================================
-- Yeon (緣) — Database schema
-- Relationship-centered peer mentoring matching platform (SIS pilot)
--
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query),
-- or via the Supabase CLI:  supabase db reset / psql -f supabase/schema.sql
-- ============================================================================

-- Clean slate (safe to re-run during the pilot) -----------------------------
drop table if exists sessions cascade;
drop table if exists matches cascade;
drop table if exists profiles cascade;

-- ---------------------------------------------------------------------------
-- profiles: mentors, mentees, and the coordinator
-- ---------------------------------------------------------------------------
create table profiles (
  id                  uuid primary key default gen_random_uuid(),
  name                text        not null,
  role                text        not null check (role in ('mentor', 'mentee', 'coordinator')),
  grade               int         check (grade between 6 and 13),
  is_new_student      boolean     not null default false,
  -- subjects: mentor -> [{ "subject": "Calculus", "strength": 5 }]
  --           mentee -> [{ "subject": "Calculus", "need": 4 }]
  subjects            jsonb       not null default '[]'::jsonb,
  interests           text[]      not null default '{}',
  -- communication_style: one of 'direct' | 'supportive' | 'structured' | 'easygoing'
  communication_style text,
  personality_tags    text[]      not null default '{}',
  -- availability slots like 'Mon-PM', 'Wed-Eve', 'Sat-AM'
  availability        text[]      not null default '{}',
  bio                 text,
  created_at          timestamptz not null default now()
);

create index profiles_role_idx on profiles (role);

-- ---------------------------------------------------------------------------
-- matches: a (mentor, mentee) connection for a subject
-- ---------------------------------------------------------------------------
create table matches (
  id                     uuid primary key default gen_random_uuid(),
  mentor_id              uuid not null references profiles (id) on delete cascade,
  mentee_id              uuid not null references profiles (id) on delete cascade,
  subject                text not null,
  -- suggested -> requested -> active -> ended | rematch
  status                 text not null default 'suggested'
                           check (status in ('suggested', 'requested', 'active', 'ended', 'rematch')),
  -- requested_by tells the My Mentoring view which side needs to accept
  requested_by           text check (requested_by in ('mentor', 'mentee', 'coordinator')),
  score                  numeric not null default 0,
  score_breakdown        jsonb   not null default '{}'::jsonb,
  coordinator_adjustment int     not null default 0,   -- -10..+10 nudge by the coordinator
  coordinator_note       text,
  created_at             timestamptz not null default now(),
  unique (mentor_id, mentee_id, subject)
);

create index matches_mentor_idx on matches (mentor_id);
create index matches_mentee_idx on matches (mentee_id);
create index matches_status_idx on matches (status);

-- ---------------------------------------------------------------------------
-- sessions: a logged mentoring session + relationship check-in
-- ---------------------------------------------------------------------------
create table sessions (
  id               uuid primary key default gen_random_uuid(),
  match_id         uuid not null references matches (id) on delete cascade,
  session_no       int  not null,
  date             date not null default current_date,
  topic            text,
  duration_min     int  not null default 60,
  satisfaction     int  check (satisfaction between 1 and 5),
  -- relationship_fit is the "is this a good fit?" check-in
  relationship_fit text check (relationship_fit in ('good', 'okay', 'poor')),
  mentee_growth    boolean not null default false, -- confidence / grade improvement flagged
  notes            text,
  created_at       timestamptz not null default now()
);

create index sessions_match_idx on sessions (match_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- This pilot runs as a closed, trusted community keyed off the public anon
-- key (no per-user auth yet), so we allow the anon role full access. When the
-- pilot adds Supabase Auth, tighten these policies to per-user rules.
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table matches  enable row level security;
alter table sessions enable row level security;

create policy "pilot full access — profiles" on profiles
  for all to anon, authenticated using (true) with check (true);

create policy "pilot full access — matches" on matches
  for all to anon, authenticated using (true) with check (true);

create policy "pilot full access — sessions" on sessions
  for all to anon, authenticated using (true) with check (true);
