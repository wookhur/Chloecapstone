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
        <div className="card narrow-centre">
          <div className="signin-mark"><Icon name="alert" size="1.4rem" /></div>
          <h1 className="text-lg detail-head">
            Something went wrong
          </h1>
          <p className="meta mb-4">
            The page hit an unexpected error. Reloading usually fixes it.
          </p>
          <div className="inline justify-center gap-2">
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
          <details className="mt-4">
            <summary className="meta">
              Technical details
            </summary>
            <pre
              className="meta post-body table-scroll mt-2"
            >
              {error.message}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}
