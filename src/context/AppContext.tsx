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
  ClassInfo,
  Conversation,
  CourseFile,
  CourseModule,
  DiscussionPost,
  DiscussionTopic,
  Enrollment,
  Message,
  ModuleItem,
  PracticeQuestion,
  PracticeQuiz,
  Profile,
  Submission,
  WikiPage,
} from '../lib/types';

interface AppState {
  loading: boolean;
  error: string | null;
  supabaseConnected: boolean;
  profiles: Profile[];
  classes: ClassInfo[];
  enrollments: Enrollment[];
  assignments: Assignment[];
  submissions: Submission[];
  announcements: Announcement[];
  discussionTopics: DiscussionTopic[];
  discussionPosts: DiscussionPost[];
  practiceQuizzes: PracticeQuiz[];
  practiceQuestions: PracticeQuestion[];
  modules: CourseModule[];
  moduleItems: ModuleItem[];
  pages: WikiPage[];
  files: CourseFile[];
  conversations: Conversation[];
  messages: Message[];
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
  /** The current user's submission for an assignment, if any. */
  mySubmission: (assignmentId: string) => Submission | undefined;
}

const AppContext = createContext<AppState | null>(null);
const STORAGE_KEY = 'hwhub.currentUserId';

export function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [discussionTopics, setDiscussionTopics] = useState<DiscussionTopic[]>([]);
  const [discussionPosts, setDiscussionPosts] = useState<DiscussionPost[]>([]);
  const [practiceQuizzes, setPracticeQuizzes] = useState<PracticeQuiz[]>([]);
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [moduleItems, setModuleItems] = useState<ModuleItem[]>([]);
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [files, setFiles] = useState<CourseFile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
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
      const [p, c, e, a, sub, an, dt, dp, pq, pqq, mo, mi, pg, fi, cv, ms] = await Promise.all([
        repo.fetchProfiles(),
        repo.fetchClasses(),
        repo.fetchEnrollments(),
        repo.fetchAssignments(),
        repo.fetchSubmissions(),
        repo.fetchAnnouncements(),
        repo.fetchDiscussionTopics(),
        repo.fetchDiscussionPosts(),
        repo.fetchPracticeQuizzes(),
        repo.fetchPracticeQuestions(),
        repo.fetchModules(),
        repo.fetchModuleItems(),
        repo.fetchPages(),
        repo.fetchFiles(),
        repo.fetchConversations(),
        repo.fetchMessages(),
      ]);
      setProfiles(p);
      setClasses(c);
      setEnrollments(e);
      setAssignments(a);
      setSubmissions(sub);
      setAnnouncements(an);
      setDiscussionTopics(dt);
      setDiscussionPosts(dp);
      setPracticeQuizzes(pq);
      setPracticeQuestions(pqq);
      setModules(mo);
      setModuleItems(mi);
      setPages(pg);
      setFiles(fi);
      setConversations(cv);
      setMessages(ms);
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

  // Default to a student for the demo.
  useEffect(() => {
    if (!currentUserId && profiles.length > 0) {
      const student = profiles.find((p) => p.role === 'student');
      setCurrentUserId(student?.id ?? profiles[0].id);
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

  const mySubmission = useCallback(
    (assignmentId: string) =>
      submissions.find(
        (s) => s.assignment_id === assignmentId && s.student_id === currentUserId,
      ),
    [submissions, currentUserId],
  );

  const value: AppState = {
    loading,
    error,
    supabaseConnected: isSupabaseConfigured,
    profiles,
    classes,
    enrollments,
    assignments,
    submissions,
    announcements,
    discussionTopics,
    discussionPosts,
    practiceQuizzes,
    practiceQuestions,
    modules,
    moduleItems,
    pages,
    files,
    conversations,
    messages,
    currentUserId,
    currentUser,
    setCurrentUserId,
    refresh,
    classById,
    profileById,
    myClassIds,
    rosterFor,
    mySubmission,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
