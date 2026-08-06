import { useState } from 'react';
import { sendMagicLink } from '../lib/auth';
import Icon, { BrandMark } from '../components/Icon';

/**
 * Sign-in gate, shown only when Supabase is connected. Ask for the school
 * email, send a link, done — nothing to remember and no password to reset the
 * week before finals.
 *
 * This is the first screen anyone sees, and for a teacher being shown the app
 * it may be the only one they judge it by, so it gets its own layout rather
 * than a card dropped into the middle of a page.
 */
/**
 * Auth errors arrive as developer strings. "Failed to fetch" tells a student
 * nothing they can act on, and this is the one screen where being stuck means
 * being locked out entirely.
 */
function readableError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);

  if (/failed to fetch|networkerror|load failed/i.test(raw)) {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  // Supabase throttles magic links per address; the default is one a minute.
  if (/for security purposes|rate limit|too many/i.test(raw)) {
    return 'That link was just sent. Wait a minute before asking for another.';
  }
  if (/invalid|not valid|unable to validate/i.test(raw) && /email/i.test(raw)) {
    return "That doesn't look like a valid email address.";
  }
  if (/signups not allowed|not authorized|disabled/i.test(raw)) {
    return "That address isn't set up for Homework Hub yet. Ask the school office to add it.";
  }
  return raw;
}

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await sendMagicLink(email);
      setSent(true);
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="signin-screen">
      <main className="signin-card">
        <div className="signin-lockup">
          <span className="signin-mark" aria-hidden="true">
            <BrandMark size="26" />
          </span>
          <h1>Homework Hub</h1>
        </div>
        <p className="signin-tagline">Every class's due dates in one place.</p>

        {sent ? (
          /* The whole screen becomes the confirmation. Leaving the form sitting
             underneath invites a second click, and the second link invalidates
             the first — so the fix looks like the failure. */
          <div className="signin-sent" role="status">
            <span className="signin-sent-mark" aria-hidden="true">
              <Icon name="mail" size="1.35rem" />
            </span>
            <h2>Check your email</h2>
            <p>
              A sign-in link is on its way to <strong>{email}</strong>. Open it on
              this device and you're in.
            </p>
            <button
              className="btn secondary"
              onClick={() => {
                setSent(false);
                setError(null);
              }}
            >
              Use a different address
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="signin-form">
            <div className="field">
              <label htmlFor="signin-email">School email</label>
              <input
                id="signin-email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                placeholder="you@school.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button className="btn signin-submit" type="submit" disabled={busy || !email.trim()}>
              {busy ? 'Sending…' : 'Email me a sign-in link'}
            </button>
            <p className="signin-hint">
              No password. We email you a link that signs you in.
            </p>
          </form>
        )}

        {error && (
          <div className="banner error" role="alert">
            <span className="dot" />
            {error}
          </div>
        )}
      </main>

      <p className="signin-foot">
        Use the address your school has on file — your classes are already
        attached to it.
      </p>
    </div>
  );
}
