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
import type { Match, Profile, Session } from '../lib/types';

interface AppState {
  loading: boolean;
  error: string | null;
  supabaseConnected: boolean;
  profiles: Profile[];
  matches: Match[];
  sessions: Session[];
  currentUserId: string | null;
  currentUser: Profile | null;
  setCurrentUserId: (id: string | null) => void;
  refresh: () => Promise<void>;
  // helpers
  profileById: (id: string) => Profile | undefined;
}

const AppContext = createContext<AppState | null>(null);

const STORAGE_KEY = 'yeon.currentUserId';

export function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
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
      const [p, m, s] = await Promise.all([
        repo.fetchProfiles(),
        repo.fetchMatches(),
        repo.fetchSessions(),
      ]);
      setProfiles(p);
      setMatches(m);
      setSessions(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  // Default the active user to the coordinator (Chaehyun) for the demo.
  useEffect(() => {
    if (!currentUserId && profiles.length > 0) {
      const coordinator = profiles.find((p) => p.role === 'coordinator');
      setCurrentUserId(coordinator?.id ?? profiles[0].id);
    }
  }, [profiles, currentUserId, setCurrentUserId]);

  const profileById = useCallback(
    (id: string) => profiles.find((p) => p.id === id),
    [profiles],
  );

  const currentUser = useMemo(
    () => profiles.find((p) => p.id === currentUserId) ?? null,
    [profiles, currentUserId],
  );

  const value: AppState = {
    loading,
    error,
    supabaseConnected: isSupabaseConfigured,
    profiles,
    matches,
    sessions,
    currentUserId,
    currentUser,
    setCurrentUserId,
    refresh,
    profileById,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
