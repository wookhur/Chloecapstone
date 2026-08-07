import { Link, useLocation } from 'react-router-dom';
import Icon from '../components/Icon';

/**
 * Anything that isn't a route.
 *
 * This used to redirect silently to whichever screen the account started on,
 * which looks identical to the app ignoring the click. A shared link that has
 * gone stale — a course that finished, an assignment a teacher deleted — is
 * the common way to land here, and it's worth saying so rather than dropping
 * someone on a dashboard and letting them wonder whether it worked.
 */
export default function NotFound({ home }: { home: string }) {
  const { pathname } = useLocation();

  return (
    <div className="notfound">
      <p className="eyebrow">Page not found</p>
      <h1>That link doesn't go anywhere</h1>
      <p className="notfound-path">{pathname}</p>
      <p className="sub">
        It may have been a course that has since finished, or work a teacher
        removed. Nothing is wrong with your account.
      </p>
      <div className="inline gap-2 mt-4">
        <Link to={home} className="btn">
          Back to {home === '/family' ? 'your student' : home.replace('/', '')}
        </Link>
      </div>
      <p className="meta mt-5">
        <Icon name="info" size="0.9em" /> If someone sent you this link, ask
        them to open it themselves and send you the address it lands on.
      </p>
    </div>
  );
}
