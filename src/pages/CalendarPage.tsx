import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Calendar from '../components/Calendar';
import AssignmentCard from '../components/AssignmentCard';
import * as repo from '../lib/repository';
import { today } from '../lib/dates';
import { subjectColor } from '../lib/subjectColor';
import {
  CALENDAR_CATEGORIES,
  type Assignment,
  type CalendarEvent,
  type CalendarEventCategory,
} from '../lib/types';

export default function CalendarPage() {
  const { currentUser, assignments, calendarEvents, classById, myClassIds, refresh } = useApp();
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(today());
  const [courseFilter, setCourseFilter] = useState<string>('all');

  const mine = useMemo(() => {
    const set = new Set(myClassIds);
    return assignments
      .filter((a) => set.has(a.class_id))
      .filter((a) => courseFilter === 'all' || a.class_id === courseFilter);
  }, [assignments, myClassIds, courseFilter]);

  const myEvents = useMemo(
    () => calendarEvents.filter((e) => e.owner_id === currentUser?.id),
    [calendarEvents, currentUser?.id],
  );

  if (!currentUser) return <div className="empty">Select a user to begin.</div>;

  const myCourses = myClassIds
    .map((id) => classById(id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .sort((a, b) => a.name.localeCompare(b.name));

  const openAddForm = (iso: string) => {
    setFormDate(iso);
    setShowForm(true);
    setSelected(null);
    setSelectedEvent(null);
  };

  return (
    <div>
      <div className="page-head">
        <div className="row-between">
          <div>
            <h1>Calendar</h1>
            <p>Your course assignments plus anything you add yourself.</p>
          </div>
          <button
            className="btn small"
            onClick={() => {
              setFormDate(today());
              setShowForm((v) => !v);
            }}
          >
            {showForm ? 'Cancel' : '+ Add event'}
          </button>
        </div>
      </div>

      {showForm && (
        <EventForm
          ownerId={currentUser.id}
          initialDate={formDate}
          onDone={async () => {
            setShowForm(false);
            await refresh();
          }}
        />
      )}

      {myCourses.length > 0 && (
        <div className="cal-legend">
          <button
            className={`legend-chip ${courseFilter === 'all' ? 'on' : ''}`}
            onClick={() => setCourseFilter('all')}
          >
            All my courses
          </button>
          {myCourses.map((c) => {
            const color = subjectColor(c.subject);
            const active = courseFilter === c.id;
            return (
              <button
                key={c.id}
                className={`legend-chip ${active ? 'on' : ''}`}
                style={active
                  ? { background: color, borderColor: color, color: '#fff' }
                  : { borderColor: `${color}66`, color }}
                onClick={() => setCourseFilter(active ? 'all' : c.id)}
              >
                <span className="legend-dot" style={{ background: active ? '#fff' : color }} />
                {c.name}
              </button>
            );
          })}
        </div>
      )}

      {myClassIds.length === 0 && myEvents.length === 0 ? (
        <div className="empty">
          Nothing on your calendar yet. Add an event above
          {currentUser.role === 'student' && (
            <>, or <Link to="/courses/browse">pick your classes →</Link></>
          )}
          .
        </div>
      ) : (
        <Calendar
          assignments={mine}
          events={myEvents}
          classById={classById}
          onSelectAssignment={(a) => { setSelected(a); setSelectedEvent(null); }}
          onSelectEvent={(e) => { setSelectedEvent(e); setSelected(null); }}
          onAddOnDate={openAddForm}
        />
      )}

      {selected && (
        <div className="section" style={{ marginTop: '1.25rem' }}>
          <div className="row-between">
            <h2>Selected assignment</h2>
            <button className="btn ghost small" onClick={() => setSelected(null)}>Clear</button>
          </div>
          <AssignmentCard assignment={selected} cls={classById(selected.class_id)} />
        </div>
      )}

      {selectedEvent && (
        <div className="section" style={{ marginTop: '1.25rem' }}>
          <div className="row-between">
            <h2>Selected event</h2>
            <button className="btn ghost small" onClick={() => setSelectedEvent(null)}>Clear</button>
          </div>
          <EventCard
            event={selectedEvent}
            canDelete={!selectedEvent.created_by || selectedEvent.created_by === currentUser.id}
            onDelete={async () => {
              await repo.deleteCalendarEvent(selectedEvent.id);
              setSelectedEvent(null);
              await refresh();
            }}
          />
        </div>
      )}
    </div>
  );
}

function EventCard({
  event,
  canDelete,
  onDelete,
}: {
  event: CalendarEvent;
  canDelete: boolean;
  onDelete: () => Promise<void>;
}) {
  const { profileById, currentUser } = useApp();
  const cat = CALENDAR_CATEGORIES.find((c) => c.key === event.category) ?? CALENDAR_CATEGORIES[0];
  const scheduledByName =
    event.created_by && event.created_by !== currentUser?.id
      ? profileById(event.created_by)?.name ?? null
      : null;
  return (
    <div className="card" style={{ borderLeft: `4px solid ${cat.color}` }}>
      <div className="row-between">
        <div>
          <h3 style={{ margin: 0 }}>{cat.emoji} {event.title}</h3>
          <p className="sub" style={{ marginTop: 2 }}>
            <span className="chip" style={{ background: `${cat.color}1a`, color: cat.color, borderColor: `${cat.color}55` }}>
              {cat.label}
            </span>{' '}
            {new Date(event.date + 'T00:00:00').toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
        {canDelete && <button className="btn danger small" onClick={onDelete}>Delete</button>}
      </div>
      {event.note && <p className="sub" style={{ marginTop: '0.6rem' }}>{event.note}</p>}
      {scheduledByName && (
        <p className="muted" style={{ fontSize: '0.78rem', marginTop: '0.5rem' }}>
          🧭 Scheduled by {scheduledByName}
        </p>
      )}
    </div>
  );
}

function EventForm({
  ownerId,
  initialDate,
  onDone,
}: {
  ownerId: string;
  initialDate: string;
  onDone: () => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(initialDate);
  const [category, setCategory] = useState<CalendarEventCategory>('event');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim() || !date) return;
    setBusy(true);
    try {
      await repo.createCalendarEvent({
        owner_id: ownerId,
        title: title.trim(),
        date,
        category,
        note: note.trim() || null,
        created_by: ownerId, // personal event — added by the owner
      });
      await onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1.25rem' }}>
      <div className="inline" style={{ gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="field" style={{ flex: '1 1 220px' }}>
          <label>What is it?</label>
          <input
            value={title}
            placeholder="e.g. Dentist appointment, Study group…"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="field" style={{ flex: '0 0 160px' }}>
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field" style={{ flex: '0 0 150px' }}>
          <label>Type</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as CalendarEventCategory)}>
            {CALENDAR_CATEGORIES.filter((c) => c.key !== 'counseling').map((c) => (
              <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label>Note <span className="hint">(optional)</span></label>
        <input value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="row-between">
        <span className="muted" style={{ fontSize: '0.8rem' }}>
          Events are personal — only you see them on your calendar.
        </span>
        <button className="btn small" disabled={!title.trim() || !date || busy} onClick={submit}>
          {busy ? 'Adding…' : 'Add to calendar'}
        </button>
      </div>
    </div>
  );
}
