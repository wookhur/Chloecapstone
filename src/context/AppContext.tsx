import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as repo from '../lib/repository';
import { isSupabaseConfigured } from '../lib/supabase';
import type {
  Announcement,
  Assignment,
  CalendarEvent,
  ClassInfo,
  CourseFile,
  DiscussionPost,
  DiscussionTopic,
  Enrollment,
  PracticeQuestion,
  PracticeQuiz,
  Profile,
} from '../lib/types';

interface AppState {
  loading: boolean;
  error: string | null;
  supabaseConnected: boolean;
  profiles: Profile[];
  classes: ClassInfo[];
  enrollments: Enrollment[];
  assignments: Assignment[];
  announcements: Announcement[];
  discussionTopics: DiscussionTopic[];
  discussionPosts: DiscussionPost[];
  practiceQuizzes: PracticeQuiz[];
  practiceQuestions: PracticeQuestion[];
  files: CourseFile[];
  calendarEvents: CalendarEvent[];
  currentUserId: string | null;
  currentUser: Profile | null;
  setCurrentUserId: (id: string | null) => void;
  refresh: () => Promise<void>;
  // helpers
  classById: (id: string) => ClassInfo | undefined;
  profileById: (id: string) => Profile | undefined;
  myClassIds: string[];
  /** Enrolled student ids for a class (sorted by name). */
  rosterFor: (classId: string) => Profile[];
}

const AppContext = createContext<AppState | null>(null);
const STORAGE_KEY = 'hwhub.currentUserId';
/** Student the seed data fills out, used as the default persona on first load. */
const DEMO_PERSONA = 'Mina';

export function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [discussionTopics, setDiscussionTopics] = useState<DiscussionTopic[]>([]);
  const [discussionPosts, setDiscussionPosts] = useState<DiscussionPost[]>([]);
  const [practiceQuizzes, setPracticeQuizzes] = useState<PracticeQuiz[]>([]);
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [files, setFiles] = useState<CourseFile[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY),
  );

  const setCurrentUserId = useCallback((id: string | null) => {
    setCurrentUserIdState(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [p, c, e, a, an, dt, dp, pq, pqq, fi, ce] = await Promise.all([
        repo.fetchProfiles(),
        repo.fetchClasses(),
        repo.fetchEnrollments(),
        repo.fetchAssignments(),
        repo.fetchAnnouncements(),
        repo.fetchDiscussionTopics(),
        repo.fetchDiscussionPosts(),
        repo.fetchPracticeQuizzes(),
        repo.fetchPracticeQuestions(),
        repo.fetchFiles(),
        repo.fetchCalendarEvents(),
      ]);
      setProfiles(p);
      setClasses(c);
      setEnrollments(e);
      setAssignments(a);
      setAnnouncements(an);
      setDiscussionTopics(dt);
      setDiscussionPosts(dp);
      setPracticeQuizzes(pq);
      setPracticeQuestions(pqq);
      setFiles(fi);
      setCalendarEvents(ce);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  // Default to the demo persona who actually has content. Picking "the first
  // student" would depend on row order, which differs between demo mode
  // (declaration order) and Supabase (ordered by name) — landing the user on an
  // empty dashboard.
  useEffect(() => {
    if (!currentUserId && profiles.length > 0) {
      const students = profiles.filter((p) => p.role === 'student');
      const seeded = students.find((p) => p.name.startsWith(DEMO_PERSONA));
      setCurrentUserId(seeded?.id ?? students[0]?.id ?? profiles[0].id);
    }
  }, [profiles, currentUserId, setCurrentUserId]);

  const classById = useCallback(
    (id: string) => classes.find((c) => c.id === id),
    [classes],
  );
  const profileById = useCallback(
    (id: string) => profiles.find((p) => p.id === id),
    [profiles],
  );

  const currentUser = useMemo(
    () => profiles.find((p) => p.id === currentUserId) ?? null,
    [profiles, currentUserId],
  );

  const myClassIds = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'teacher') {
      return classes.filter((c) => c.teacher_id === currentUser.id).map((c) => c.id);
    }
    return enrollments
      .filter((e) => e.student_id === currentUser.id)
      .map((e) => e.class_id);
  }, [currentUser, classes, enrollments]);

  const rosterFor = useCallback(
    (classId: string) =>
      enrollments
        .filter((e) => e.class_id === classId)
        .map((e) => profiles.find((p) => p.id === e.student_id))
        .filter((p): p is Profile => Boolean(p))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [enrollments, profiles],
  );

  const value: AppState = {
    loading,
    error,
    supabaseConnected: isSupabaseConfigured,
    profiles,
    classes,
    enrollments,
    assignments,
    announcements,
    discussionTopics,
    discussionPosts,
    practiceQuizzes,
    practiceQuestions,
    files,
    calendarEvents,
    currentUserId,
    currentUser,
    setCurrentUserId,
    refresh,
    classById,
    profileById,
    myClassIds,
    rosterFor,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
