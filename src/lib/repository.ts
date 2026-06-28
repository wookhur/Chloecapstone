import { isSupabaseConfigured, supabase } from './supabase';
import { demoMatches, demoProfiles, demoSessions } from './demoData';
import type { Match, Profile, Session } from './types';

/**
 * Data access for Yeon. When Supabase is configured every call hits the
 * database; otherwise it operates on an in-memory copy of the demo data so the
 * UI stays fully interactive during local exploration.
 */

// --- In-memory store (fallback) --------------------------------------------
const mem = {
  profiles: [...demoProfiles],
  matches: [...demoMatches],
  sessions: [...demoSessions],
};

const uuid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random()}`);

// --- Reads ------------------------------------------------------------------
export async function fetchProfiles(): Promise<Profile[]> {
  if (!isSupabaseConfigured) return [...mem.profiles];
  const { data, error } = await supabase!
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as Profile[];
}

export async function fetchMatches(): Promise<Match[]> {
  if (!isSupabaseConfigured) return [...mem.matches];
  const { data, error } = await supabase!.from('matches').select('*');
  if (error) throw error;
  return data as Match[];
}

export async function fetchSessions(): Promise<Session[]> {
  if (!isSupabaseConfigured) return [...mem.sessions];
  const { data, error } = await supabase!.from('sessions').select('*');
  if (error) throw error;
  return data as Session[];
}

// --- Writes -----------------------------------------------------------------
export async function upsertProfile(
  profile: Omit<Profile, 'id' | 'created_at'> & { id?: string },
): Promise<Profile> {
  if (!isSupabaseConfigured) {
    if (profile.id) {
      const idx = mem.profiles.findIndex((p) => p.id === profile.id);
      const updated = { ...mem.profiles[idx], ...profile } as Profile;
      mem.profiles[idx] = updated;
      return updated;
    }
    const created: Profile = {
      ...profile,
      id: uuid(),
      created_at: new Date().toISOString(),
    } as Profile;
    mem.profiles.push(created);
    return created;
  }
  const { data, error } = await supabase!
    .from('profiles')
    .upsert(profile)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function createMatch(
  match: Omit<Match, 'id' | 'created_at'>,
): Promise<Match> {
  if (!isSupabaseConfigured) {
    const created: Match = { ...match, id: uuid(), created_at: new Date().toISOString() };
    mem.matches.push(created);
    return created;
  }
  const { data, error } = await supabase!
    .from('matches')
    .insert(match)
    .select()
    .single();
  if (error) throw error;
  return data as Match;
}

export async function updateMatch(
  id: string,
  patch: Partial<Match>,
): Promise<Match> {
  if (!isSupabaseConfigured) {
    const idx = mem.matches.findIndex((m) => m.id === id);
    mem.matches[idx] = { ...mem.matches[idx], ...patch };
    return mem.matches[idx];
  }
  const { data, error } = await supabase!
    .from('matches')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Match;
}

export async function createSession(
  session: Omit<Session, 'id' | 'created_at'>,
): Promise<Session> {
  if (!isSupabaseConfigured) {
    const created: Session = {
      ...session,
      id: uuid(),
      created_at: new Date().toISOString(),
    };
    mem.sessions.push(created);
    return created;
  }
  const { data, error } = await supabase!
    .from('sessions')
    .insert(session)
    .select()
    .single();
  if (error) throw error;
  return data as Session;
}
