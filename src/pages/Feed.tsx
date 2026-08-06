import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import AssignmentCard from '../components/AssignmentCard';
import {
  TIMEFRAME_LABELS,
  dueLabel,
  inTimeframe,
  parseISO,
  type Timeframe,
} from '../lib/dates';
import { subjectColor } from '../lib/subjectColor';
import Icon from '../components/Icon';

const TIMEFRAMES: Timeframe[] = ['today', 'week', 'month', 'year', 'upcoming'];

export default function Feed() {
  const { currentUser, assignments, classById, myClassIds, isDone } = useApp();
  const [timeframe, setTimeframe] = useState<Timeframe>('week');
  const [rawClassFilter, setClassFilter] = useState<string>('all');
  const [hideDone, setHideDone] = useState(false);

  // Switching users (or dropping a class) must not leave a filter pinned to a
  // course you're no longer in — that reads as "nothing due".
  const classFilter = myClassIds.includes(rawClassFilter) ? rawClassFilter : 'all';

  const inScope = useMemo(() => {
    const classSet = new Set(myClassIds);
    return assignments
      .filter((a) => classSet.has(a.class_id))
      .filter((a) => classFilter === 'all' || a.class_id === classFilter)
      .filter((a) => inTimeframe(a.due_date, timeframe))
      .sort((a, b) => parseISO(a.due_date).getTime() - parseISO(b.due_date).getTime());
  }, [assignments, myClassIds, classFilter, timeframe]);

  const doneCount = useMemo(() => inScope.filter((a) => isDone(a.id)).length, [inScope, isDone]);
  const filtered = useMemo(
    () => (hideDone ? inScope.filter((a) => !isDone(a.id)) : inScope),
    [inScope, hideDone, isDone],
  );

  // Group by due date for readable sections.
  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const a of filtered) {
      const list = map.get(a.due_date) ?? [];
      list.push(a);
      map.set(a.due_date, list);
    }
    return [...map.entries()];
  }, [filtered]);

  if (!currentUser) return <div className="empty">Select a user to begin.</div>;

  const myClasses = myClassIds
    .map((id) => classById(id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const isStudent = currentUser.role === 'student';

  if (myClassIds.length === 0) {
    return (
      <div>
        <div className="page-head">
          <h1>Homework</h1>
        </div>
        <div className="empty">
          {isStudent ? (
            <>
              You haven't picked any classes yet.{' '}
              <Link to="/classes">Choose your classes <Icon name="arrow-right" size="0.9em" /></Link>
            </>
          ) : (
            <>You don't teach any classes yet. Create one from “My Classes”.</>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <h1>Homework</h1>
        <p>
          {isStudent
            ? 'Everything due across the classes you’re taking.'
            : 'Assignments across the classes you teach.'}
        </p>
      </div>

      {isStudent && (
        <div className="callout subtle-callout">
          <span className="callout-icon"><Icon name="checklist" /></span>
          <div>
            Got <strong>paper homework</strong> that isn't listed here? Ask your teacher
            to post its due date in Homework Hub — accurate dates keep everyone on track
            and give you one place to see what's due.
          </div>
        </div>
      )}

      <div className="toolbar">
        <div className="toggle-group">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              className={`toggle ${timeframe === tf ? 'on' : ''}`}
              onClick={() => setTimeframe(tf)}
            >
              {TIMEFRAME_LABELS[tf]}
            </button>
          ))}
        </div>
        {isStudent && inScope.length > 0 && (
          <div className="progress-row">
            <span className="meta">
              {doneCount} of {inScope.length} done
            </span>
            <label className="inline meta gap-1">
              <input
                type="checkbox"
                checked={hideDone}
                onChange={(e) => setHideDone(e.target.checked)}
              />
              Hide done
            </label>
          </div>
        )}
        <select
          className="select"
          aria-label="Filter by class"
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
        >
          <option value="all">All my classes</option>
          {myClasses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {groups.length === 0 ? (
        <div className="empty">
          Nothing due {TIMEFRAME_LABELS[timeframe].toLowerCase()}.
        </div>
      ) : (
        <div className="stack">
          {groups.map(([date, items]) => (
            <div key={date} className="feed-group">
              <div className="feed-group-head">
                <span
                  className="feed-date-dot"
                  style={{
                    background: subjectColor(classById(items[0].class_id)?.subject ?? ''),
                  }}
                />
                <strong>{dueLabel(date)}</strong>
                <span className="muted">
                  {parseISO(date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="grid cols-2">
                {items.map((a) => (
                  <AssignmentCard key={a.id} assignment={a} cls={classById(a.class_id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
