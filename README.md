# 🗓️ Homework Hub

A website where students **pick the classes they're taking**, then see **all the
homework their teachers post** — as a filterable feed (day / week / month / year)
**and** a unified calendar across every class they're enrolled in.

## What it does

**Students**
- Browse the class catalog and select the classes they're taking for the year
- See a **Homework feed** of everything due across those classes, filter by
  *Today / This week / This month / This year / All upcoming* and by class
- See a **Calendar** with every assignment laid out by due date, color-coded by subject

**Teachers**
- Create the classes they teach
- Post homework, quizzes, tests, and projects (title, details, due date, optional link)
- Edit or delete assignments

## Features

| Area | What it does |
| --- | --- |
| Class picker | Students add/remove classes; feed & calendar update to match |
| Homework feed | Grouped by due date, with day/week/month/year + per-class filters |
| Calendar | Month grid, subject-colored, click an assignment for details |
| Teacher tools | Create classes, post/edit/delete assignments |
| Roles | Student / Teacher (admin reserved for a later phase) |

## Tech stack

- **React + Vite + TypeScript** front end
- **Supabase** (Postgres) for data — schema + seed in [`supabase/`](./supabase)
- **Netlify** for hosting (config in [`netlify.toml`](./netlify.toml))
- Falls back to an in-memory demo dataset when Supabase isn't configured, so the
  app is fully explorable out of the box.

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
```

That's enough to explore everything in **demo mode** (data lives in memory).
Use the "Signed in as" switcher (top-right) to try it as a student or a teacher.

### Connect Supabase (persistent data)

1. Create a project at [supabase.com](https://supabase.com).
2. In the dashboard **SQL Editor**, run [`supabase/schema.sql`](./supabase/schema.sql)
   then [`supabase/seed.sql`](./supabase/seed.sql).
3. Copy your project URL and anon key into a local env file:
   ```bash
   cp .env.example .env.local
   # edit .env.local: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   ```
4. Restart `npm run dev`. The "Demo mode" banner disappears and data is live.

> The pilot RLS policies grant the anon key full access for a closed cohort.
> Tighten them once Supabase Auth is added (see comments in `schema.sql`).

## Deploying to Netlify

Connected to GitHub → Netlify auto-builds on every push to `main`
(`npm run build` → `dist`). The `netlify.toml` includes an SPA redirect so
client-side routes like `/calendar` resolve on refresh. To use real data in
production, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Netlify →
Site configuration → Environment variables.

## Project structure

```
supabase/        schema.sql + seed.sql
src/
  lib/           supabase client, types, dates, subject colors, repository
  context/       AppContext — data loading + current-user switcher
  components/     AssignmentCard, Calendar
  pages/          ClassPicker (student), Feed, CalendarPage, TeacherClasses
```

## Roadmap

- **Phase 2:** real login (Supabase Auth / Google), file attachments (Supabase
  Storage), "mark as done" checklist, admin catalog management, search, reminders
- **Phase 3:** recurring assignments, export to Google/Apple Calendar (iCal),
  comments on assignments, dark mode
