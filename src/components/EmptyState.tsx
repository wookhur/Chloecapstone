import type { ReactNode } from 'react';
import Icon, { type IconName } from './Icon';

/**
 * A tab with nothing in it yet.
 *
 * A lone grey sentence reads like something failed. Giving the state a mark, a
 * heading and a line of orientation makes it read as a place that is simply
 * new — and where there's an obvious next move, `children` puts the button that
 * fills it right here, instead of leaving someone to hunt for it.
 *
 * Reserved for the routine "this is empty" states. A genuine error — "Course
 * not found" — should stay a plain line; dressing it up would make it look
 * like a normal state when it isn't one.
 */
export default function EmptyState({
  icon,
  title,
  children,
}: {
  icon: IconName;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty is-composed">
      <span className="empty-mark" aria-hidden="true">
        <Icon name={icon} size="1.2rem" />
      </span>
      <p className="empty-title">{title}</p>
      {children && <div className="empty-body">{children}</div>}
    </div>
  );
}
