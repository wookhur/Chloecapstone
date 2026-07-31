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
emailing dates around. They can **post the times they're free** (weekly repeats
in one go) and students **book an open time themselves** — it's on their
calendar immediately, with no waiting for a reply. Students with nothing that
suits them can still just ask, and get the answer on their dashboard.

**Parents/guardians** get one read-only screen (`/family`): what's coming up for
their student and any counseling meetings booked. Deliberately read-only — a
parent seeing the workload helps, a parent ticking work off does not.

**Inside every course**

| Tab | What it does |
| --- | --- |
| Home | Recent announcements, upcoming work, active discussions |
| Announcements | Teacher posts class-wide notices |
| Assignments | Upcoming/past list; a detail page with instructions and resource links (read-only — this isn't a submission portal) |
| Discussions | Threaded topics — anyone can start one and reply |
| Practice Quizzes | **Quizlet-style, student-made** — any student builds a multiple-choice quiz; classmates practice with instant feedback, a score, and unlimited retries (never graded). The **class question bank** pools every card the class wrote into one shuffled round, and a new quiz can pull in cards that already exist instead of retyping them |
| People | Course roster |
| Files | Real file uploads — the teacher posts the handout (up to 20 MB) and students open it from the course, so the worksheet sits next to its due date |

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

### Tests

```bash
npx playwright install chromium   # first time only
npm test
```

The suite drives a real browser against a production build in demo mode, so it
needs no database. It covers the main flows (calendar, assignments, practice
quizzes, discussions, counselor scheduling), plus the things easiest to break
without noticing: date handling in three timezones, phone/tablet/desktop
layout, dark mode, and keyboard/screen-reader accessibility.

### Connect Supabase (persistent data)

1. Create a project at [supabase.com](https://supabase.com).
2. In the dashboard **SQL Editor**, run [`supabase/schema.sql`](./supabase/schema.sql),
   then [`supabase/seed.sql`](./supabase/seed.sql), then
   [`supabase/storage.sql`](./supabase/storage.sql) (creates the private
   `course-files` bucket that the Files tab uploads to).
3. Copy your project URL and anon key into a local env file:
   ```bash
   cp .env.example .env.local
   # edit .env.local: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   ```
4. Restart `npm run dev`. The "Demo mode" banner disappears, data is live, and
   the app now asks people to sign in.

> Connecting Supabase also turns on **sign-in** — see below. The starting RLS
> policies grant the anon key full access so the app stays explorable; once real
> accounts exist, run [`supabase/rls-auth.sql`](./supabase/rls-auth.sql) to
> restrict every table and the file bucket to signed-in users.

### Signing in

With Supabase connected, the demo account switcher disappears and the app opens
on a sign-in screen. It emails a **magic link** — no passwords for students to
lose, and no reset flow to support.

Sign-in matches the email against `profiles.email`, so the office creates
people's profiles up front and signing in attaches you to the record that
already has your classes. An address with no profile is told to ask the office
rather than being dropped into an empty app.

In Supabase → **Authentication → URL Configuration**, set the site URL to your
deployment so the link comes back to the right place. Without Supabase
configured, none of this appears and the app stays in demo mode.

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
supabase/        schema.sql, seed.sql, storage.sql (file bucket), rls-auth.sql
src/
  lib/           supabase client, auth, storage, googleClassroom, types, dates, ical,
                 reminders, quizBank, subject colors, repository
  context/       AppContext — data loading + current-user switcher
  components/    AssignmentCard, Calendar (assignments + personal events)
  pages/         SignIn, Dashboard, CoursesPage, ImportClassroom, Discussions (global hub),
                 Feed, CalendarPage, ClassPicker (student), TeacherClasses (teacher)
  pages/course/  CourseLayout + tabs: Home, Announcements, Assignments,
                 AssignmentDetail, Discussions, Quizzes (practice), QuizTake,
                 People, Files
```

## Roadmap

Grading stays out of scope — PowerSchool remains the system of record.

Shipped since the first version: due-date reminders, personal done checkboxes,
iCal export, bulk and repeating assignment entry, student-requested counselor
meetings, parent/guardian accounts, real file uploads, magic-link sign-in, and
class question banks, and counselor availability slots.

- **Next:** emailed weekly digests (needs a scheduled server job, not just the
  browser)
