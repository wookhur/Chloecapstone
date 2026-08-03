import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  disableNotifications,
  dueSoon,
  enableNotifications,
  notificationsEnabled,
  notificationsSupported,
  notifyDueSoon,
  reminderLabel,
} from '../lib/reminders';
import Icon from './Icon';

/**
 * What's about to be late, surfaced at the top of the dashboard so a student
 * sees it without going looking. Anything they've ticked off is excluded — this
 * is a warning, not an archive.
 */
export default function DueSoon() {
  const { currentUser, assignments, myClassIds, classById, isDone } = useApp();
  const [remindersOn, setRemindersOn] = useState(notificationsEnabled);

  const urgent = useMemo(() => {
    const mine = new Set(myClassIds);
    return dueSoon(assignments.filter((a) => mine.has(a.class_id) && !isDone(a.id)));
  }, [assignments, myClassIds, isDone]);

  // Fire browser notifications when the app opens, at most once per item a day.
  useEffect(() => {
    if (remindersOn && urgent.length > 0) notifyDueSoon(urgent);
  }, [remindersOn, urgent]);

  if (currentUser?.role !== 'student') return null;

  const toggleReminders = async () => {
    if (remindersOn) {
      disableNotifications();
      setRemindersOn(false);
      return;
    }
    setRemindersOn(await enableNotifications());
  };

  if (urgent.length === 0) {
    return (
      <div className="callout subtle-callout">
        <span className="callout-icon"><Icon name="check" /></span>
        <div className="row-between" style={{ flex: 1 }}>
          <span>Nothing due in the next couple of days. Nice.</span>
          {notificationsSupported && (
            <button className="btn secondary small" onClick={toggleReminders}>
              <><Icon name="clock" />{remindersOn ? 'Reminders on' : 'Turn on reminders'}</>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="due-soon" aria-labelledby="due-soon-heading">
      <div className="row-between" style={{ marginBottom: '0.6rem' }}>
        <h2 id="due-soon-heading" className="section-title">
          Due soon ({urgent.length})
        </h2>
        {notificationsSupported && (
          <button className="btn secondary small" onClick={toggleReminders}>
            <><Icon name="clock" />{remindersOn ? 'Reminders on' : 'Turn on reminders'}</>
          </button>
        )}
      </div>

      <ul className="plain-list boxed">
        {urgent.slice(0, 5).map((a) => {
          const cls = classById(a.class_id);
          const overdue = a.due_date < new Date().toISOString().slice(0, 10);
          return (
            <li key={a.id} className="list-row">
              <div className="inline" style={{ gap: '0.5rem' }}>
                <div>
                  <Link to={`/courses/${a.class_id}/assignments/${a.id}`} style={{ fontWeight: 600 }}>
                    {a.title}
                  </Link>
                  <div className="meta">{cls?.name}</div>
                </div>
              </div>
              <span className={`due ${overdue ? 'overdue' : ''}`}>
                {reminderLabel(a.due_date)}
              </span>
            </li>
          );
        })}
      </ul>

      {!remindersOn && notificationsSupported && (
        <p className="meta" style={{ marginTop: '0.5rem' }}>
          Turn on reminders and your device will tell you about these even when
          Homework Hub isn't open.
        </p>
      )}
    </section>
  );
}
