import { useMemo, useState } from 'react';
import * as repo from '../../lib/repository';
import { WEEKDAY_LABELS, today, parseISO, weeklyDates } from '../../lib/dates';
import { ASSIGNMENT_TYPES, type AssignmentType, type ClassInfo } from '../../lib/types';

type Mode = 'list' | 'repeat';

interface Draft {
  title: string;
  due: string;
  type: AssignmentType;
  error?: string;
}

/**
 * Two ways to post a whole unit at once, because filling the single-assignment
 * form ten times is exactly the friction that stops teachers posting due dates
 * at all — and the due dates are the point of this app.
 *
 * - "Paste a list" takes lines of `title, date` copied from a syllabus.
 * - "Repeats weekly" turns "every Friday until December" into dated rows, so
 *   everything downstream still sees ordinary assignments.
 */
export default function BulkAssignments({
  cls,
  teacherId,
  onDone,
}: {
  cls: ClassInfo;
  teacherId: string;
  onDone: () => Promise<void>;
}) {
  const [mode, setMode] = useState<Mode>('list');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // --- paste-a-list mode ---
  const [pasted, setPasted] = useState('');
  const [listType, setListType] = useState<AssignmentType>('homework');

  const drafts: Draft[] = useMemo(() => {
    return pasted
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        // "Chapter 4 worksheet, 2026-09-12" — split on the LAST comma so titles
        // may contain commas themselves.
        const cut = line.lastIndexOf(',');
        if (cut === -1) {
          return { title: line, due: '', type: listType, error: 'No date — add ", YYYY-MM-DD"' };
        }
        const title = line.slice(0, cut).trim();
        const due = line.slice(cut + 1).trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) {
          return { title, due, type: listType, error: `"${due}" isn't a YYYY-MM-DD date` };
        }
        if (Number.isNaN(parseISO(due).getTime())) {
          return { title, due, type: listType, error: 'Not a real date' };
        }
        if (!title) return { title, due, type: listType, error: 'Missing title' };
        return { title, due, type: listType };
      });
  }, [pasted, listType]);

  const validDrafts = drafts.filter((d) => !d.error);
  const badDrafts = drafts.filter((d) => d.error);

  // --- repeats-weekly mode ---
  const [repeatTitle, setRepeatTitle] = useState('');
  const [weekday, setWeekday] = useState(5); // Friday
  const [from, setFrom] = useState(today());
  const [until, setUntil] = useState('');
  const [repeatType, setRepeatType] = useState<AssignmentType>('quiz');

  const repeatDates = useMemo(
    () => (until ? weeklyDates(from, until, weekday) : []),
    [from, until, weekday],
  );

  const save = async (rows: { title: string; due: string; type: AssignmentType }[]) => {
    if (rows.length === 0) return;
    setBusy(true);
    try {
      await repo.createAssignments(
        rows.map((r) => ({
          class_id: cls.id,
          title: r.title,
          description: null,
          assigned_date: today(),
          due_date: r.due,
          type: r.type,
          link: null,
          created_by: teacherId,
        })),
      );
      setResult(`Posted ${rows.length} assignment${rows.length === 1 ? '' : 's'} ✓`);
      setPasted('');
      setRepeatTitle('');
      setUntil('');
      await onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div className="toggle-group" style={{ marginBottom: '0.85rem' }}>
        <button
          className={`toggle ${mode === 'list' ? 'on' : ''}`}
          onClick={() => { setMode('list'); setResult(null); }}
        >
          Paste a list
        </button>
        <button
          className={`toggle ${mode === 'repeat' ? 'on' : ''}`}
          onClick={() => { setMode('repeat'); setResult(null); }}
        >
          Repeats weekly
        </button>
      </div>

      {mode === 'list' ? (
        <>
          <div className="field">
            <label htmlFor="bulk-paste">
              One assignment per line <span className="hint">title, YYYY-MM-DD</span>
            </label>
            <textarea
              id="bulk-paste"
              value={pasted}
              style={{ minHeight: 120, fontFamily: 'ui-monospace, monospace' }}
              placeholder={'Chapter 4 worksheet, 2026-09-12\nUnit 4 quiz, 2026-09-19\nUnit 4 test, 2026-09-26'}
              onChange={(e) => setPasted(e.target.value)}
            />
          </div>
          <div className="field" style={{ maxWidth: 180 }}>
            <label htmlFor="bulk-type">Type for all</label>
            <select
              id="bulk-type"
              value={listType}
              onChange={(e) => setListType(e.target.value as AssignmentType)}
            >
              {ASSIGNMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {drafts.length > 0 && (
            <div className="bulk-preview">
              <p className="meta">
                {validDrafts.length} ready
                {badDrafts.length > 0 && ` · ${badDrafts.length} need fixing`}
              </p>
              <ul className="plain-list">
                {drafts.map((d, i) => (
                  <li key={i} className={`bulk-row ${d.error ? 'has-error' : ''}`}>
                    <span>{d.error ? '⚠️' : '✓'} {d.title || <em>(no title)</em>}</span>
                    <span className="meta">{d.error ?? d.due}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="row-between" style={{ marginTop: '0.75rem' }}>
            {result ? <span className="meta">{result}</span> : <span />}
            <button
              className="btn small"
              disabled={validDrafts.length === 0 || busy}
              onClick={() => save(validDrafts.map(({ title, due, type }) => ({ title, due, type })))}
            >
              {busy ? 'Posting…' : `Post ${validDrafts.length || ''} assignment${validDrafts.length === 1 ? '' : 's'}`}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="inline" style={{ gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div className="field" style={{ flex: '1 1 220px' }}>
              <label htmlFor="repeat-title">Title</label>
              <input
                id="repeat-title"
                value={repeatTitle}
                placeholder="e.g. Weekly vocab quiz"
                onChange={(e) => setRepeatTitle(e.target.value)}
              />
            </div>
            <div className="field" style={{ flex: '0 0 140px' }}>
              <label htmlFor="repeat-day">Every</label>
              <select
                id="repeat-day"
                value={weekday}
                onChange={(e) => setWeekday(Number(e.target.value))}
              >
                {WEEKDAY_LABELS.map((label, i) => (
                  <option key={label} value={i}>{label}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ flex: '0 0 150px' }}>
              <label htmlFor="repeat-from">From</label>
              <input
                id="repeat-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="field" style={{ flex: '0 0 150px' }}>
              <label htmlFor="repeat-until">Until</label>
              <input
                id="repeat-until"
                type="date"
                value={until}
                onChange={(e) => setUntil(e.target.value)}
              />
            </div>
            <div className="field" style={{ flex: '0 0 130px' }}>
              <label htmlFor="repeat-type">Type</label>
              <select
                id="repeat-type"
                value={repeatType}
                onChange={(e) => setRepeatType(e.target.value as AssignmentType)}
              >
                {ASSIGNMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {until && (
            <p className="meta bulk-preview">
              {repeatDates.length === 0
                ? 'No dates in that range.'
                : `Creates ${repeatDates.length} ${WEEKDAY_LABELS[weekday]}s: ${repeatDates
                    .slice(0, 3)
                    .join(', ')}${repeatDates.length > 3 ? ` … ${repeatDates[repeatDates.length - 1]}` : ''}`}
            </p>
          )}

          <div className="row-between" style={{ marginTop: '0.75rem' }}>
            {result ? <span className="meta">{result}</span> : <span />}
            <button
              className="btn small"
              disabled={!repeatTitle.trim() || repeatDates.length === 0 || busy}
              onClick={() =>
                save(
                  repeatDates.map((due, i) => ({
                    title: `${repeatTitle.trim()} ${i + 1}`,
                    due,
                    type: repeatType,
                  })),
                )
              }
            >
              {busy ? 'Posting…' : `Post ${repeatDates.length || ''} dates`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
