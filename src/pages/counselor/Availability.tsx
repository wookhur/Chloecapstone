import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import * as repo from '../../lib/repository';
import { WEEKDAY_LABELS, parseISO, today, weeklyDates } from '../../lib/dates';
import { displayName } from '../../lib/names';

/**
 * Times a counselor says they're free. Students book these themselves, which is
 * the point: the old flow was a student asking and then waiting to hear back,
 * and the waiting is what made people give up and not talk to anyone.
 *
 * Times are free text ("Lunch A", "Period 5") because schools run on periods,
 * not clock times, and this is what a counselor would write on a sign-up sheet.
 */
export default function Availability({ counselorId }: { counselorId: string }) {
  const { counselorSlots, profileById, refresh } = useApp();
  const [date, setDate] = useState(today());
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('Room 102');
  const [repeatUntil, setRepeatUntil] = useState('');
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const mine = useMemo(
    () =>
      counselorSlots
        .filter((s) => s.counselor_id === counselorId && s.date >= today())
        .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time)),
    [counselorSlots, counselorId],
  );

  const open = mine.filter((s) => !s.booked_by);

  const add = async () => {
    if (!date || !time.trim()) return;
    setBusy(true);
    setFlash(null);
    try {
      // A counselor's free period is the same every week, so posting one term's
      // worth shouldn't be one form submission per week.
      const dates = repeatUntil
        ? weeklyDates(date, repeatUntil, parseISO(date).getDay())
        : [date];
      const created = await repo.createCounselorSlots(
        dates.map((d) => ({
          counselor_id: counselorId,
          date: d,
          start_time: time.trim(),
          location: location.trim() || null,
          booked_by: null,
        })),
      );
      await refresh();
      setTime('');
      setFlash(
        created.length === dates.length
          ? `Posted ${created.length} time${created.length === 1 ? '' : 's'} ✓`
          : `Posted ${created.length} — the rest were already on your list.`,
      );
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await repo.deleteCounselorSlot(id);
    await refresh();
  };

  const weekday = date ? WEEKDAY_LABELS[parseISO(date).getDay()] : '';

  return (
    <div className="section">
      <h2 className="section-title">My open times ({open.length})</h2>
      <p className="sub" style={{ margin: '0 0 0.75rem' }}>
        Students book these themselves — no back-and-forth, and nobody waits on an
        email to find out whether you're free.
      </p>

      <div className="card" style={{ marginBottom: '0.75rem' }}>
        <div className="inline" style={{ gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div className="field" style={{ flex: '0 0 160px' }}>
            <label htmlFor="slot-date">Date</label>
            <input
              id="slot-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="field" style={{ flex: '1 1 170px' }}>
            <label htmlFor="slot-time">Time</label>
            <input
              id="slot-time"
              value={time}
              placeholder="Lunch A (11:15)"
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <div className="field" style={{ flex: '0 0 150px' }}>
            <label htmlFor="slot-loc">Where <span className="hint">(optional)</span></label>
            <input id="slot-loc" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="field" style={{ flex: '0 0 190px' }}>
            <label htmlFor="slot-until">
              Repeat weekly until <span className="hint">(optional)</span>
            </label>
            <input
              id="slot-until"
              type="date"
              value={repeatUntil}
              min={date}
              onChange={(e) => setRepeatUntil(e.target.value)}
            />
          </div>
        </div>
        <div className="row-between">
          <span className="meta">
            {flash ??
              (repeatUntil
                ? `Every ${weekday} through ${repeatUntil}.`
                : 'One time slot. Set a repeat date to post a whole term at once.')}
          </span>
          <button className="btn small" disabled={!date || !time.trim() || busy} onClick={add}>
            {busy ? 'Posting…' : 'Post this time'}
          </button>
        </div>
      </div>

      {mine.length === 0 ? (
        <div className="empty">No open times posted yet.</div>
      ) : (
        <ul className="plain-list boxed">
          {mine.map((s) => {
            const student = s.booked_by ? profileById(s.booked_by) : null;
            return (
              <li key={s.id} className={`list-row ${s.booked_by ? 'is-done' : ''}`}>
                <div>
                  <strong>
                    {parseISO(s.date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    · {s.start_time}
                  </strong>
                  <div className="meta">
                    {s.location ? `${s.location} · ` : ''}
                    {student ? `Booked by ${displayName(student)}` : 'Open'}
                  </div>
                </div>
                {s.booked_by ? (
                  <span className="inline" style={{ gap: '0.4rem' }}>
                    <span className="chip request-accepted">Booked</span>
                    <button
                      className="btn secondary small"
                      aria-label={`Free up ${s.date} ${s.start_time}`}
                      onClick={async () => {
                        await repo.releaseCounselorSlot(s.id);
                        await refresh();
                      }}
                    >
                      Free up
                    </button>
                  </span>
                ) : (
                  <button
                    className="btn danger small"
                    aria-label={`Remove ${s.date} ${s.start_time}`}
                    onClick={() => remove(s.id)}
                  >
                    Remove
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
