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
import {
  currentAuthUser,
  isAuthEnabled,
  onAuthChange,
  profileForEmail,
  signOut as authSignOut,
  type AuthUser,
} from '../lib/auth';
import { isSupabaseConfigured } from '../lib/supabase';
import type {
  Announcement,
  Assignment,
  CalendarEvent,
  ClassInfo,
  Completion,
  CounselorSlot,
  CourseFile,
  DiscussionPost,
  DiscussionTopic,
  Enrollment,
  Guardianship,
  MeetingRequest,
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
  completions: Completion[];
  announcements: Announcement[];
  discussionTopics: DiscussionTopic[];
  discussionPosts: DiscussionPost[];
  practiceQuizzes: PracticeQuiz[];
  practiceQuestions: PracticeQuestion[];
  files: CourseFile[];
  calendarEvents: CalendarEvent[];
  meetingRequests: MeetingRequest[];
  counselorSlots: CounselorSlot[];
  guardianships: Guardianship[];
  /** Students a parent account follows (empty for everyone else). */
  myStudents: Profile[];
  currentUserId: string | null;
  currentUser: Profile | null;
  setCurrentUserId: (id: string | null) => void;
  refresh: () => Promise<void>;
  /** True when Supabase is connected, so people sign in instead of picking an account. */
  authEnabled: boolean;
  /** Who is signed in with Supabase Auth (null in demo mode, or before sign-in). */
  authUser: AuthUser | null;
  /** Still checking for an existing session — don't show the sign-in screen yet. */
  authLoading: boolean;
  signOut: () => Promise<void>;
  // helpers
  classById: (id: string) => ClassInfo | undefined;
  profileById: (id: string) => Profile | undefined;
  myClassIds: string[];
  /** Enrolled student ids for a class (sorted by name). */
  rosterFor: (classId: string) => Profile[];
  /** Has the signed-in student ticked this assignment off their own list? */
  isDone: (assignmentId: string) => boolean;
  /** Toggle that tick. Updates immediately, then persists. */
  toggleDone: (assignmentId: string) => Promise<void>;
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
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [discussionTopics, setDiscussionTopics] = useState<DiscussionTopic[]>([]);
  const [discussionPosts, setDiscussionPosts] = useState<DiscussionPost[]>([]);
  const [practiceQuizzes, setPracticeQuizzes] = useState<PracticeQuiz[]>([]);
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [files, setFiles] = useState<CourseFile[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>([]);
  const [counselorSlots, setCounselorSlots] = useState<CounselorSlot[]>([]);
  const [guardianships, setGuardianships] = useState<Guardianship[]>([]);
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY),
  );
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(isAuthEnabled);

  const setCurrentUserId = useCallback((id: string | null) => {
    setCurrentUserIdState(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [p, c, e, a, cp, an, dt, dp, pq, pqq, fi, ce, mr, cs, gu] = await Promise.all([
        repo.fetchProfiles(),
        repo.fetchClasses(),
        repo.fetchEnrollments(),
        repo.fetchAssignments(),
        repo.fetchCompletions(),
        repo.fetchAnnouncements(),
        repo.fetchDiscussionTopics(),
        repo.fetchDiscussionPosts(),
        repo.fetchPracticeQuizzes(),
        repo.fetchPracticeQuestions(),
        repo.fetchFiles(),
        repo.fetchCalendarEvents(),
        repo.fetchMeetingRequests(),
        repo.fetchCounselorSlots(),
        repo.fetchGuardianships(),
      ]);
      setProfiles(p);
      setClasses(c);
      setEnrollments(e);
      setAssignments(a);
      setCompletions(cp);
      setAnnouncements(an);
      setDiscussionTopics(dt);
      setDiscussionPosts(dp);
      setPracticeQuizzes(pq);
      setPracticeQuestions(pqq);
      setFiles(fi);
      setCalendarEvents(ce);
      setMeetingRequests(mr);
      setCounselorSlots(cs);
      setGuardianships(gu);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  // Load the data — but with auth on, not until someone is actually signed in.
  // Fetching first would mean an unauthenticated visitor hammering the tables,
  // and a slow or unreachable database would hold them on "Loading…" with no
  // sign-in screen to reach.
  useEffect(() => {
    if (isAuthEnabled) {
      if (authLoading) return;
      if (!authUser) {
        setLoading(false);
        return;
      }
    }
    (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, [refresh, authUser, authLoading]);

  // Watch the Supabase session. Also fires on the redirect back from a magic
  // link, which is how the sign-in actually completes.
  useEffect(() => {
    if (!isAuthEnabled) return;
    let cancelled = false;
    currentAuthUser()
      .then((u) => {
        if (cancelled) return;
        setAuthUser(u);
        setAuthLoading(false);
      })
      .catch(() => !cancelled && setAuthLoading(false));
    const unsubscribe = onAuthChange((u) => {
      setAuthUser(u);
      setAuthLoading(false);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // Signed in: you are whoever the school's profile list says that email is.
  // No switcher, and nothing in localStorage can override it.
  useEffect(() => {
    if (!isAuthEnabled) return;
    if (!authUser) {
      setCurrentUserId(null);
      return;
    }
    if (profiles.length === 0) return;
    setCurrentUserId(profileForEmail(profiles, authUser.email)?.id ?? null);
  }, [authUser, profiles, setCurrentUserId]);

  const signOut = useCallback(async () => {
    await authSignOut();
    setAuthUser(null);
    setCurrentUserId(null);
  }, [setCurrentUserId]);

  // Demo mode picks who's signed in. Defaults to the demo persona who actually
  // has content — "the first student" would depend on row order, which differs
  // between demo mode (declaration order) and Supabase (ordered by name).
  //
  // Also self-heals a saved id that no longer resolves: switching demo ->
  // Supabase, or reseeding the database, changes every id, and a stale one
  // leaves the app stuck showing "Select a user to begin" while the account
  // switcher misleadingly displays the first person in the list.
  useEffect(() => {
    if (isAuthEnabled) return;
    if (profiles.length === 0) return;
    const stillExists = currentUserId && profiles.some((p) => p.id === currentUserId);
    if (stillExists) return;
    const students = profiles.filter((p) => p.role === 'student');
    const seeded = students.find((p) => p.name.startsWith(DEMO_PERSONA));
    setCurrentUserId(seeded?.id ?? students[0]?.id ?? profiles[0].id);
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

  // Students a parent account follows. Everyone else gets an empty list.
  const myStudents = useMemo(() => {
    if (currentUser?.role !== 'parent') return [];
    const ids = new Set(
      guardianships.filter((g) => g.parent_id === currentUser.id).map((g) => g.student_id),
    );
    return profiles.filter((p) => ids.has(p.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [currentUser, guardianships, profiles]);

  const isDone = useCallback(
    (assignmentId: string) =>
      completions.some(
        (c) => c.assignment_id === assignmentId && c.student_id === currentUserId,
      ),
    [completions, currentUserId],
  );

  // Ticking a box has to feel instant, so update local state first and reconcile
  // with the server after; on failure we put the old state back.
  const toggleDone = useCallback(
    async (assignmentId: string) => {
      if (!currentUserId) return;
      const wasDone = completions.some(
        (c) => c.assignment_id === assignmentId && c.student_id === currentUserId,
      );
      const optimisticId = `pending-${assignmentId}`;

      setCompletions((prev) =>
        wasDone
          ? prev.filter(
              (c) => !(c.assignment_id === assignmentId && c.student_id === currentUserId),
            )
          : [
              ...prev,
              {
                id: optimisticId,
                assignment_id: assignmentId,
                student_id: currentUserId,
                completed_at: new Date().toISOString(),
              },
            ],
      );

      try {
        await repo.setCompleted(assignmentId, currentUserId, !wasDone);
        const fresh = await repo.fetchCompletions();
        setCompletions(fresh);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        const fresh = await repo.fetchCompletions().catch(() => null);
        if (fresh) setCompletions(fresh);
      }
    },
    [completions, currentUserId],
  );

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
    completions,
    announcements,
    discussionTopics,
    discussionPosts,
    practiceQuizzes,
    practiceQuestions,
    files,
    calendarEvents,
    meetingRequests,
    counselorSlots,
    guardianships,
    myStudents,
    currentUserId,
    currentUser,
    setCurrentUserId,
    refresh,
    authEnabled: isAuthEnabled,
    authUser,
    authLoading,
    signOut,
    classById,
    profileById,
    myClassIds,
    rosterFor,
    isDone,
    toggleDone,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
