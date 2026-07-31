import { isSupabaseConfigured, supabase } from './supabase';
import type { Profile } from './types';

/**
 * Sign-in for Homework Hub.
 *
 * Email magic links, not passwords: the school already owns everyone's email
 * account, and a password is one more thing for a fifteen-year-old to lose. A
 * link also means no password reset flow to build or support.
 *
 * Auth only exists when Supabase does. Without it the app stays in demo mode
 * with the account switcher, so anyone can look around without an account.
 */
export const isAuthEnabled = isSupabaseConfigured;

/** The part of a Supabase session this app actually uses. */
export interface AuthUser {
  id: string;
  email: string;
}

function toAuthUser(user: { id: string; email?: string } | null | undefined): AuthUser | null {
  if (!user?.email) return null;
  return { id: user.id, email: user.email };
}

export async function currentAuthUser(): Promise<AuthUser | null> {
  if (!isAuthEnabled) return null;
  const { data } = await supabase!.auth.getSession();
  return toAuthUser(data.session?.user);
}

/** Fires on sign-in, sign-out, and token refresh. Returns an unsubscribe. */
export function onAuthChange(cb: (user: AuthUser | null) => void): () => void {
  if (!isAuthEnabled) return () => {};
  const { data } = supabase!.auth.onAuthStateChange((_event, session) => {
    cb(toAuthUser(session?.user));
  });
  return () => data.subscription.unsubscribe();
}

/**
 * Send the magic link. `emailRedirectTo` brings them back to this deployment
 * rather than Supabase's default site URL, which matters once the app is on a
 * real domain.
 */
export async function sendMagicLink(email: string): Promise<void> {
  if (!isAuthEnabled) throw new Error('Sign-in needs Supabase to be configured.');
  const { error } = await supabase!.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  if (!isAuthEnabled) return;
  await supabase!.auth.signOut();
}

/**
 * Match a signed-in email to the profile the school seeded for that person.
 *
 * Profiles are created by the office ahead of time, so signing in attaches you
 * to an existing student/teacher record instead of creating a stranger with no
 * classes. Someone with a valid school email but no profile row gets told to
 * ask the office rather than being dropped into an empty app.
 */
export function profileForEmail(profiles: Profile[], email: string): Profile | null {
  const wanted = email.trim().toLowerCase();
  return profiles.find((p) => p.email?.toLowerCase() === wanted) ?? null;
}
