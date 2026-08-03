import { Component, type ErrorInfo, type ReactNode } from 'react';
import Icon from './Icon';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time crashes so a single bad component shows a recoverable
 * message instead of a blank white page — which is all a student would
 * otherwise see, with no way to tell whether the site or their phone broke.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Homework Hub crashed:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="center-screen">
        <div className="card" style={{ maxWidth: 460, textAlign: 'center' }}>
          <div className="signin-mark"><Icon name="alert" size="1.4rem" /></div>
          <h1 style={{ fontSize: 'var(--text-lg)', margin: '0.5rem 0 0.25rem' }}>
            Something went wrong
          </h1>
          <p className="meta" style={{ marginBottom: '1rem' }}>
            The page hit an unexpected error. Reloading usually fixes it.
          </p>
          <div className="inline" style={{ justifyContent: 'center', gap: '0.5rem' }}>
            <button className="btn small" onClick={() => window.location.reload()}>
              Reload
            </button>
            <button
              className="btn secondary small"
              onClick={() => {
                // A corrupted saved account is the most likely cause we can undo.
                localStorage.removeItem('hwhub.currentUserId');
                window.location.href = '/';
              }}
            >
              Start over
            </button>
          </div>
          <details style={{ marginTop: '1rem', textAlign: 'left' }}>
            <summary className="meta" style={{ cursor: 'pointer' }}>
              Technical details
            </summary>
            <pre
              className="meta"
              style={{ whiteSpace: 'pre-wrap', overflowX: 'auto', marginTop: '0.5rem' }}
            >
              {error.message}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}
