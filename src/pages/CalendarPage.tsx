import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Calendar from '../components/Calendar';
import AssignmentCard from '../components/AssignmentCard';
import * as repo from '../lib/repository';
import { today } from '../lib/dates';
import { accent, subjectColor } from '../lib/subjectColor';
import { displayName } from '../lib/names';
import { buildICS, downloadICS } from '../lib/ical';
import {
  CALENDAR_CATEGORIES,
  type Assignment,
  type CalendarEvent,
  type CalendarEventCategory,
} from '../lib/types';
import Icon, { type IconName } from '../components/Icon';

export default function CalendarPage() {
  const { currentUser, assignments, calendarEvents, classById, myClassIds, refresh } = useApp();
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(today());
  const [rawCourseFilter, setCourseFilter] = useState<string>('all');
  // Don't keep filtering by a course the current user isn't in.
  const courseFilter = myClassIds.includes(rawCourseFilter) ? rawCourseFilter : 'all';

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

  // A snapshot the student can open in the calendar app they already use.
  const exportCalendar = () => {
    downloadICS(
      buildICS({
        assignments: mine,
        events: myEvents,
        classById,
        calendarName: `Homework Hub — ${displayName(currentUser)}`,
      }),
      'homework-hub.ics',
    );
  };

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
          <div className="inline gap-1">
            <button className="btn secondary small" onClick={exportCalendar}>
              <><Icon name="upload" /> Export (.ics)</>
            </button>
            <button
              className={`btn small ${showForm ? "secondary" : ""}`}
              onClick={() => {
                setFormDate(today());
                setShowForm((v) => !v);
              }}
            >
              {showForm ? 'Cancel' : '+ Add event'}
            </button>
          </div>
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
            <>, or <Link to="/courses/browse">pick your classes <Icon name="arrow-right" size="0.9em" /></Link></>
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
        <div className="section mt-5">
          <div className="row-between">
            <h2>Selected assignment</h2>
            <button className="btn ghost small" onClick={() => setSelected(null)}>Clear</button>
          </div>
          <AssignmentCard assignment={selected} cls={classById(selected.class_id)} />
        </div>
      )}

      {selectedEvent && (
        <div className="section mt-5">
          <div className="row-between">
            <h2>Selected event</h2>
            <button className="btn ghost small" onClick={() => setSelectedEvent(null)}>Clear</button>
          </div>
          <EventCard
            event={selectedEvent}
            // Closed direction: only the person who added it may remove it, so a
            // counselor meeting whose author row is gone can't be self-deleted.
            canDelete={selectedEvent.created_by === currentUser.id}
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
      ? displayName(profileById(event.created_by))
      : null;
  return (
    <div className="card accent-left" style={accent(cat.color)}>
      <div className="row-between">
        <div>
          <h3 className="inline m-0">
            <Icon name={cat.icon as IconName} />
            {event.title}
          </h3>
          <p className="sub mt-1">
            <span className="subject-chip">
              <span className="legend-dot" style={{ background: cat.color }} />
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
      {event.note && <p className="sub mt-3">{event.note}</p>}
      {scheduledByName && (
        <p className="meta mt-2">
          <Icon name="compass" /> Scheduled by {scheduledByName}
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
    <div className="card mb-5">
      <div className="inline form-row">
        <div className="field">
          <label>What is it?</label>
          <input
aria-label="What is it?"             value={title}
            placeholder="e.g. Dentist appointment, Study group…"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="field w-date">
          <label>Date</label>
          <input aria-label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field w-mid">
          <label>Type</label>
          <select aria-label="Type" value={category} onChange={(e) => setCategory(e.target.value as CalendarEventCategory)}>
            {CALENDAR_CATEGORIES.filter((c) => c.key !== 'counseling').map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label>Note <span className="hint">(optional)</span></label>
        <input aria-label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="row-between">
        <span className="muted text-xs">
          Events are personal — only you see them on your calendar.
        </span>
        <button className="btn small" disabled={!title.trim() || !date || busy} onClick={submit}>
          {busy ? 'Adding…' : 'Add to calendar'}
        </button>
      </div>
    </div>
  );
}
