// Google Classroom integration.
//
// Mirrors the Supabase pattern: with no VITE_GOOGLE_CLIENT_ID configured the
// app runs in DEMO mode and returns a realistic sample snapshot, so the whole
// "Import from Google Classroom" flow is explorable without any credentials.
// Set VITE_GOOGLE_CLIENT_ID (and enable the Classroom API in Google Cloud) to
// connect a real account — the same code then does read-only OAuth + fetch.

import { toISODate } from './dates';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export const isGoogleClassroomConfigured = Boolean(CLIENT_ID);

// Read-only scopes: the signed-in user's courses, their coursework, and
// class announcements. (No write access — this is an import.)
const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/classroom.announcements.readonly',
].join(' ');

// --- Shape of what we pull out of Classroom (a small, app-shaped subset) -----
export interface GClassroomCourse {
  id: string;
  name: string;
  section: string | null;
  ownerName: string;
  room: string | null;
}

export interface GClassroomCoursework {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  dueDate: string | null; // YYYY-MM-DD
  workType: 'homework' | 'quiz' | 'test' | 'project';
}

export interface GClassroomAnnouncement {
  id: string;
  courseId: string;
  text: string;
  createTime: string; // ISO
}

export interface ClassroomSnapshot {
  demo: boolean;
  courses: GClassroomCourse[];
  coursework: GClassroomCoursework[];
  announcements: GClassroomAnnouncement[];
}

// --- Demo snapshot ------------------------------------------------------------
const iso = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return toISODate(d);
};

function demoSnapshot(): ClassroomSnapshot {
  return {
    demo: true,
    courses: [
      { id: 'gc-phys', name: 'AP Physics 1', section: 'Period 3', ownerName: 'Mr. Okafor', room: 'Lab D' },
      { id: 'gc-gov', name: 'US Government', section: 'Period 5', ownerName: 'Ms. Petrova', room: '308' },
      { id: 'gc-art', name: 'Art History', section: 'Period 6', ownerName: 'Mr. Okafor', room: '112' },
    ],
    coursework: [
      { id: 'gcw1', courseId: 'gc-phys', title: 'Kinematics problem set', description: 'Problems 1–18, chapter 2.', dueDate: iso(2), workType: 'homework' },
      { id: 'gcw2', courseId: 'gc-phys', title: 'Free-fall lab', description: 'Measure g with the photogate. Lab report due Monday.', dueDate: iso(7), workType: 'project' },
      { id: 'gcw3', courseId: 'gc-phys', title: 'Unit 1 test — motion', description: null, dueDate: iso(10), workType: 'test' },
      { id: 'gcw4', courseId: 'gc-gov', title: 'Read: Federalist No. 10', description: 'Annotate and bring 2 discussion questions.', dueDate: iso(1), workType: 'homework' },
      { id: 'gcw5', courseId: 'gc-gov', title: 'Branches of government quiz', description: null, dueDate: iso(4), workType: 'quiz' },
      { id: 'gcw6', courseId: 'gc-art', title: 'Renaissance slideshow', description: 'Pick one artist; 5 slides.', dueDate: iso(12), workType: 'project' },
    ],
    announcements: [
      { id: 'ga1', courseId: 'gc-phys', text: 'Bring a calculator every day this week — we start kinematics.', createTime: new Date().toISOString() },
      { id: 'ga2', courseId: 'gc-gov', text: 'Reminder: current-events journal is due Friday.', createTime: new Date().toISOString() },
    ],
  };
}

// --- Real Google Identity Services token flow ---------------------------------
let gisScriptPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (gisScriptPromise) return gisScriptPromise;
  gisScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-gis]');
    if (existing) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.dataset.gis = 'true';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(s);
  });
  return gisScriptPromise;
}

/** Pop the Google consent screen and resolve an OAuth access token. */
async function getAccessToken(): Promise<string> {
  await loadGis();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const google = (window as any).google;
  if (!google?.accounts?.oauth2) throw new Error('Google Identity Services unavailable');
  return new Promise<string>((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      callback: (resp: any) => {
        if (resp.error) reject(new Error(resp.error));
        else resolve(resp.access_token as string);
      },
    });
    client.requestAccessToken();
  });
}

const WORK_TYPE_MAP: Record<string, GClassroomCoursework['workType']> = {
  ASSIGNMENT: 'homework',
  SHORT_ANSWER_QUESTION: 'homework',
  MULTIPLE_CHOICE_QUESTION: 'quiz',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function apiDueDate(w: any): string | null {
  if (!w.dueDate) return null;
  const { year, month, day } = w.dueDate;
  if (!year || !month || !day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

async function fetchReal(): Promise<ClassroomSnapshot> {
  const token = await getAccessToken();
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const get = async (url: string) => {
    const r = await fetch(url, auth);
    if (!r.ok) throw new Error(`Classroom API ${r.status}`);
    return r.json();
  };

  const courseData = await get(
    'https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE&pageSize=50',
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawCourses: any[] = courseData.courses ?? [];

  const courses: GClassroomCourse[] = rawCourses.map((c) => ({
    id: c.id,
    name: c.name,
    section: c.section ?? null,
    ownerName: c.ownerId ? `Teacher ${String(c.ownerId).slice(-4)}` : 'Teacher',
    room: c.room ?? null,
  }));

  const coursework: GClassroomCoursework[] = [];
  const announcements: GClassroomAnnouncement[] = [];
  for (const c of rawCourses) {
    const [cw, an] = await Promise.all([
      get(`https://classroom.googleapis.com/v1/courses/${c.id}/courseWork?pageSize=50`).catch(
        () => ({}),
      ),
      get(`https://classroom.googleapis.com/v1/courses/${c.id}/announcements?pageSize=20`).catch(
        () => ({}),
      ),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const w of (cw.courseWork ?? []) as any[]) {
      coursework.push({
        id: w.id,
        courseId: c.id,
        title: w.title ?? 'Untitled',
        description: w.description ?? null,
        dueDate: apiDueDate(w),
        workType: WORK_TYPE_MAP[w.workType] ?? 'homework',
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const a of (an.announcements ?? []) as any[]) {
      announcements.push({
        id: a.id,
        courseId: c.id,
        text: a.text ?? '',
        createTime: a.creationTime ?? new Date().toISOString(),
      });
    }
  }

  return { demo: false, courses, coursework, announcements };
}

/** Connect (real OAuth if configured, demo data otherwise) and pull a snapshot. */
export async function fetchClassroomSnapshot(): Promise<ClassroomSnapshot> {
  if (!isGoogleClassroomConfigured) {
    // Small delay so the demo feels like a real connect.
    await new Promise((r) => setTimeout(r, 400));
    return demoSnapshot();
  }
  return fetchReal();
}
