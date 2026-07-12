# 🗓️ Homework Hub

A **Canvas-style LMS** for school: students pick their classes, see everything
due in one feed and calendar, submit work online, take auto-graded quizzes and
check their grades — while teachers post assignments, grade in a SpeedGrader,
run a full gradebook, and manage announcements, discussions, modules, pages
and files per course.

## What it does

**Everyone**
- **Dashboard** — color-coded course cards (with your current grade) plus a
  To-Do sidebar (students: work due; teachers: submissions to grade)
- **Global navigation rail** — Dashboard · Courses · Calendar · Inbox · To Do
- **Calendar** — every assignment across your courses, color-coded by subject
- **Inbox** — compose and reply to private conversations

**Inside every course** (Canvas-style course menu)

| Tab | What it does |
| --- | --- |
| Home | Recent announcements, upcoming work, active discussions |
| Announcements | Teacher posts class-wide notices |
| Assignments | Upcoming/past list with points & status; detail page with **online submission** (text entry / website URL) |
| Discussions | Threaded topics — anyone can start one and reply |
| Grades | Students: score list + total (letter grade). Teachers: full **Gradebook grid** with click-to-edit cells |
| People | Course roster |
| Pages | Wiki-style course content (teacher-editable) |
| Files | Course file list (metadata now; storage in a later phase) |
| Syllabus | Course policies + auto-generated course summary table |
| Quizzes | **Online quizzes with auto-grading** — teachers build multiple-choice questions, students get one attempt and an instant score |
| Modules | Ordered units mixing pages, assignments, and external links |

**Teachers also get**
- **SpeedGrader** — step through the roster per assignment, view each
  submission, enter a score + feedback comment
- Assignment builder with points, due date and submission type
- Class creation and course-content management on every tab

**Submission statuses** work like Canvas: *Not submitted · Submitted · Late ·
Missing · Graded*, and course grades roll up to a percent + letter grade.

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
Use the "Signed in as" switcher (top-right) to try it as a student or a teacher
— e.g. Mina (student) and Ms. Anderson (teacher) share the Algebra II course,
which is fully populated: submissions, grades, a quiz, modules, pages and more.

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
supabase/        schema.sql + seed.sql (15 tables)
src/
  lib/           supabase client, types, dates, grades math, subject colors, repository
  context/       AppContext — data loading + current-user switcher
  components/    AssignmentCard, Calendar
  pages/         Dashboard, CoursesPage, Inbox, Feed, CalendarPage,
                 ClassPicker (student), TeacherClasses (teacher)
  pages/course/  CourseLayout + tabs: Home, Announcements, Assignments,
                 AssignmentDetail, SpeedGrader, Discussions, Grades/Gradebook,
                 Quizzes, QuizTake, Modules, Pages, People, Files, Syllabus
```

## Roadmap

- **Phase 2:** real login (Supabase Auth / Google), file attachments (Supabase
  Storage), rubrics, quiz question banks & timers, notifications
- **Phase 3:** weighted grading groups, export to Google/Apple Calendar (iCal),
  parent/observer accounts, dark mode
