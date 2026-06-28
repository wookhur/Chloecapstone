# Yeon · 緣 — Learning, connected.

A **relationship-centered peer mentoring & tutoring matching platform** for
Seoul International School (SIS). Unlike tutoring tools that pair students on
subject ability alone, Yeon also weighs *people compatibility* — shared
interests, personality, and communication style — and keeps a human
coordinator at the center of every connection.

> 기술이 후보를 추려주면, 마지막 '사람을 연결하는 일'은 코디네이터가 책임집니다.
> Technology narrows the candidates; a coordinator makes the final, human call.

## Why it's different

- **Relationship-centered matching** — score = subject fit (40) + interest /
  personality compatibility (35) + time overlap (15) + coordinator judgment (10).
- **Relationship health** — quick "is this a good fit?" check-ins surface
  struggling matches early so the coordinator can gently re-match.
- **Coordinator-in-the-loop** — the coordinator reviews, nudges, and connects.
- **Points & volunteer hours** — recognition that ties into the school's
  volunteer-hour and honor-society programs.

## Features

| Area | What it does |
| --- | --- |
| Onboarding / Profile | Role select (mentor/mentee), subject, interests, personality, communication style, availability |
| Matches | Ranked recommendations with a visible score breakdown & shared interests |
| Request / accept | Mentees request, mentors accept, coordinator can connect directly |
| Sessions & check-ins | Log sessions with rating + relationship-fit check-in |
| Points & volunteer hours | Per-person ledger, badges, mentor volunteer-hour totals |
| Coordinator dashboard | All matches, relationship health, re-matching, ± nudge, CSV school report |

## Tech stack

- **React + Vite + TypeScript** front end
- **Supabase** (Postgres) for data — schema + seed in [`supabase/`](./supabase)
- Falls back to an in-memory demo dataset when Supabase isn't configured, so
  the app is fully explorable out of the box.

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
```

That's enough to explore everything in **demo mode** (data lives in memory).

### Connect Supabase (persistent data)

1. Create a project at [supabase.com](https://supabase.com).
2. In the dashboard **SQL Editor**, run [`supabase/schema.sql`](./supabase/schema.sql)
   then [`supabase/seed.sql`](./supabase/seed.sql).
3. Copy your project URL and anon key into a local env file:
   ```bash
   cp .env.example .env.local
   # then edit .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   ```
4. Restart `npm run dev`. The banner switches from "Demo mode" to live data.

> The pilot RLS policies grant the anon key full access for a closed, trusted
> cohort. Tighten them once Supabase Auth is added (see comments in `schema.sql`).

## How matching works

See [`src/lib/matching.ts`](./src/lib/matching.ts). For each mentee, candidate
mentors are filtered to those who teach a needed subject at an equal-or-higher
grade, then scored on the four weighted components above. The coordinator's ±
nudge feeds directly into the score, so human judgment is part of the algorithm
— not an override bolted on top.

## Project structure

```
supabase/        schema.sql + seed.sql
src/
  lib/           supabase client, types, matching engine, points rules, repository
  context/       AppContext — data loading + active-user switcher
  components/     ProfileForm, RecommendationCard, ScoreBreakdown
  pages/          Onboarding, Profile, Recommendations, MyMentoring, Points, Coordinator
```

Built as the pilot ("단일 웹앱 → 단계적 확장") described in the Yeon proposal.
