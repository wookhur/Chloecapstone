import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const DEMO_FLAG = 'hwhub.demo';

/**
 * `?demo` turns the whole app back into the sample dataset, even on the live
 * site with a real database behind it.
 *
 * This exists for showing the app to someone. Sign-in is the right default —
 * a student's work is theirs — but it also means a teacher being shown this
 * for the first time cannot get past the front door without an account being
 * created for them first, which is a poor way to open a conversation. With
 * `?demo` they can be handed a link and click straight into any role.
 *
 * It reveals nothing: demo mode never contacts Supabase at all, and every row
 * it shows is invented data compiled into the bundle. `?demo=0` leaves again.
 */
function demoRequested(): boolean {
  if (typeof window === 'undefined') return false;
  const asked = new URLSearchParams(window.location.search).get('demo');
  try {
    if (asked === '0' || asked === 'false') {
      sessionStorage.removeItem(DEMO_FLAG);
      return false;
    }
    // Remembered for the tab, so client-side navigation doesn't drop out of
    // demo mode the moment someone clicks a link.
    if (asked !== null) {
      sessionStorage.setItem(DEMO_FLAG, '1');
      return true;
    }
    return sessionStorage.getItem(DEMO_FLAG) === '1';
  } catch {
    // Private browsing can throw on sessionStorage; the query string still works.
    return asked !== null && asked !== '0' && asked !== 'false';
  }
}

/** True when this session is deliberately showing sample data. */
export const isDemoRequested = demoRequested();

/**
 * True when both Supabase env vars are present *and* nobody asked for the
 * demo. When false, the app falls back to an in-memory dataset so it still
 * runs end-to-end without a backend — which is also what makes sign-in
 * disappear, since there is nothing to sign in to.
 */
export const isSupabaseConfigured = Boolean(url && anonKey) && !isDemoRequested;

export const supabase = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : null;
