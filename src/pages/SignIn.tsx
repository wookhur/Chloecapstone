import { useState } from 'react';
import { sendMagicLink } from '../lib/auth';
import { BrandMark } from '../components/Icon';

/**
 * Sign-in gate, shown only when Supabase is connected. Ask for the school
 * email, send a link, done — nothing to remember and no password to reset the
 * week before finals.
 */
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
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="center-screen">
      <div className="card signin-card">
        <div className="signin-mark" aria-hidden="true"><BrandMark size="34" /></div>
        <h1 style={{ margin: '0.5rem 0 0.25rem' }}>Homework Hub</h1>
        <p className="meta" style={{ marginTop: 0 }}>
          Every class's due dates in one place.
        </p>

        {sent ? (
          <div className="banner" role="status" style={{ marginTop: '1rem' }}>
            <span className="dot" />
            <div>
              <strong>Check your email.</strong>
              <p style={{ margin: '0.25rem 0 0' }}>
                We sent a sign-in link to {email}. Opening it on this device signs you in.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} style={{ marginTop: '1rem' }}>
            <label className="field">
              <span>School email</span>
              <input
                id="signin-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@school.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <button className="btn" type="submit" disabled={busy || !email.trim()}>
              {busy ? 'Sending…' : 'Email me a sign-in link'}
            </button>
          </form>
        )}

        {error && (
          <div className="banner error" role="alert" style={{ marginTop: '1rem' }}>
            <span className="dot" />
            {error}
          </div>
        )}

        <p className="meta" style={{ marginTop: '1rem' }}>
          Use the address the school has on file — your classes are already
          attached to it.
        </p>
      </div>
    </div>
  );
}
