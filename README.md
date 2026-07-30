# 🗓️ Homework Hub

A homework & course hub for school. Students pick their classes and see
everything due in one place — a feed and a personal calendar — talk with each
class in discussions, and study with practice quizzes classmates make. It sits
alongside the school's grade system (e.g. PowerSchool), so it focuses on
staying organized rather than grading.

## What it does

**Everyone**
- **Dashboard** — color-coded course cards plus a "Coming up" list of upcoming
  work (shown first on mobile)
- **Global navigation rail** — Dashboard · Courses · Calendar · Discussions ·
  To Do (a bottom tab bar on phones)
- **Calendar** — course assignments **plus events you add by hand** (exams,
  reminders, meetings, personal) — click any day's **+** to add one
- **Discussions** — a hub across all your courses: pick a class, **search by
  keyword**, **sort by date**, and jump into any thread to reply
- **To Do** — everything due, filterable by day/week/month and by class
- **Import from Google Classroom** — pull your courses, coursework (with due
  dates), and announcements in read-only (with a built-in demo when no Google
  credentials are set)
- **Dark mode** — follows your device's appearance setting automatically

**Counselors** get their own account type and a console (`/counselor`) for
scheduling counseling meetings straight onto a student's calendar instead of
emailing dates around. The student sees who scheduled it and can't delete it.

**Inside every course**

| Tab | What it does |
| --- | --- |
| Home | Recent announcements, upcoming work, active discussions |
| Announcements | Teacher posts class-wide notices |
| Assignments | Upcoming/past list; a detail page with instructions and resource links (read-only — this isn't a submission portal) |
| Discussions | Threaded topics — anyone can start one and reply |
| Practice Quizzes | **Quizlet-style, student-made** — any student builds a multiple-choice quiz; classmates practice with instant feedback, a score, and unlimited retries (never graded) |
| People | Course roster |
| Files | Course file list (metadata now; storage in a later phase) |

Assignments are informational (the school's system of record handles grades),
so there's no online submission or grading here.

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
which is fully populated: assignments, announcements, discussions, student-made
practice quizzes, and Mina's personal calendar events.

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

### Connect Google Classroom (read-only import)

**Courses → 🎓 Import from Google Classroom** pulls your Classroom courses,
their coursework (with due dates), and announcements into Homework Hub. With no
credentials it runs a built-in **demo import** using sample data, so the whole
flow works out of the box.

To connect a real account:

1. In [Google Cloud Console](https://console.cloud.google.com), create a project
   and **enable the "Google Classroom API"**.
2. Create an **OAuth 2.0 Client ID** (type: *Web application*) and add your site
   to the authorized JavaScript origins (e.g. `http://localhost:5173`).
3. Put the client ID in `.env.local`:
   ```bash
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```
4. Restart. "Connect" now opens the real Google consent screen and imports your
   own courses (read-only scopes — nothing is changed in Google Classroom).

> Import is one-way and read-only. On a managed school Google Workspace, an
> admin may need to allow the app before students/teachers can grant access;
> sensitive scopes work for up to 100 test users before Google app verification.

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
  lib/           supabase client, googleClassroom, types, dates, subject colors, repository
  context/       AppContext — data loading + current-user switcher
  components/    AssignmentCard, Calendar (assignments + personal events)
  pages/         Dashboard, CoursesPage, ImportClassroom, Discussions (global hub),
                 Feed, CalendarPage, ClassPicker (student), TeacherClasses (teacher)
  pages/course/  CourseLayout + tabs: Home, Announcements, Assignments,
                 AssignmentDetail, Discussions, Quizzes (practice), QuizTake,
                 People, Files
```

## Roadmap

Grading stays out of scope — PowerSchool remains the system of record.

- **Phase 2:** real login (Supabase Auth / Google), real file uploads (Supabase
  Storage), due-date reminders/notifications, practice-quiz question banks
- **Phase 3:** export to Google/Apple Calendar (iCal), parent/observer accounts,
  richer counselor scheduling (availability slots, student-requested meetings)
