import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Calendar from '../components/Calendar';
import AssignmentCard from '../components/AssignmentCard';
import type { Assignment } from '../lib/types';

export default function CalendarPage() {
  const { currentUser, assignments, classById, myClassIds } = useApp();
  const [selected, setSelected] = useState<Assignment | null>(null);

  if (!currentUser) return <div className="empty">Select a user to begin.</div>;

  const mine = useMemo(() => {
    const set = new Set(myClassIds);
    return assignments.filter((a) => set.has(a.class_id));
  }, [assignments, myClassIds]);

  if (myClassIds.length === 0) {
    return (
      <div>
        <div className="page-head"><h1>Calendar</h1></div>
        <div className="empty">
          {currentUser.role === 'student' ? (
            <>Pick your classes to fill your calendar. <Link to="/classes">Choose classes →</Link></>
          ) : (
            <>You don't teach any classes yet.</>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <h1>Calendar</h1>
        <p>All your homework, laid out by due date. Click an item for details.</p>
      </div>

      <Calendar
        assignments={mine}
        classById={classById}
        onSelectAssignment={setSelected}
      />

      {selected && (
        <div className="section" style={{ marginTop: '1.25rem' }}>
          <div className="row-between">
            <h2>Selected assignment</h2>
            <button className="btn ghost small" onClick={() => setSelected(null)}>Clear</button>
          </div>
          <AssignmentCard assignment={selected} cls={classById(selected.class_id)} />
        </div>
      )}
    </div>
  );
}
