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
import type { Assignment, ClassInfo, Enrollment, Profile } from '../lib/types';

interface AppState {
  loading: boolean;
  error: string | null;
  supabaseConnected: boolean;
  profiles: Profile[];
  classes: ClassInfo[];
  enrollments: Enrollment[];
  assignments: Assignment[];
  currentUserId: string | null;
  currentUser: Profile | null;
  setCurrentUserId: (id: string | null) => void;
  refresh: () => Promise<void>;
  // helpers
  classById: (id: string) => ClassInfo | undefined;
  profileById: (id: string) => Profile | undefined;
  myClassIds: string[];
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
      const [p, c, e, a] = await Promise.all([
        repo.fetchProfiles(),
        repo.fetchClasses(),
        repo.fetchEnrollments(),
        repo.fetchAssignments(),
      ]);
      setProfiles(p);
      setClasses(c);
      setEnrollments(e);
      setAssignments(a);
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

  const value: AppState = {
    loading,
    error,
    supabaseConnected: isSupabaseConfigured,
    profiles,
    classes,
    enrollments,
    assignments,
    currentUserId,
    currentUser,
    setCurrentUserId,
    refresh,
    classById,
    profileById,
    myClassIds,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
