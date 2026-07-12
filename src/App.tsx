import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useApp } from './context/AppContext';
import ClassPicker from './pages/ClassPicker';
import Feed from './pages/Feed';
import CalendarPage from './pages/CalendarPage';
import TeacherClasses from './pages/TeacherClasses';
import Dashboard from './pages/Dashboard';
import CoursesPage from './pages/CoursesPage';
import Inbox from './pages/Inbox';
import CourseLayout from './pages/course/CourseLayout';

/** Canvas-style global navigation rail entries. */
const GLOBAL_NAV = [
  { to: '/dashboard', glyph: '🏠', label: 'Dashboard' },
  { to: '/courses', glyph: '📚', label: 'Courses' },
  { to: '/calendar', glyph: '🗓️', label: 'Calendar' },
  { to: '/inbox', glyph: '✉️', label: 'Inbox' },
  { to: '/homework', glyph: '✅', label: 'To Do' },
];

export default function App() {
  const { loading, currentUser, profiles, currentUserId, setCurrentUserId, supabaseConnected } =
    useApp();

  if (loading) return <div className="center-screen">Loading Homework Hub…</div>;

  return (
    <div className="app-shell rail-layout">
      <aside className="global-rail">
        <div className="rail-brand" title="Homework Hub">
          🗓️
        </div>
        {GLOBAL_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `rail-item ${isActive ? 'active' : ''}`}
          >
            <span className="rail-glyph">{item.glyph}</span>
            <span className="rail-label">{item.label}</span>
          </NavLink>
        ))}
      </aside>

      <div className="rail-main">
        <header className="topbar">
          <div className="brand">
            <span className="name">Homework Hub</span>
            <span className="chip" style={{ marginLeft: '0.5rem' }}>
              {currentUser?.role ?? '—'}
            </span>
          </div>
          <div className="topbar-spacer" />
          <div className="user-switcher">
            <label htmlFor="user">Signed in as</label>
            <select
              id="user"
              value={currentUserId ?? ''}
              onChange={(e) => setCurrentUserId(e.target.value)}
            >
              <optgroup label="Students">
                {profiles.filter((p) => p.role === 'student').map((p) => (
                  <option key={p.id} value={p.id}>{p.name} · G{p.grade}</option>
                ))}
              </optgroup>
              <optgroup label="Teachers">
                {profiles.filter((p) => p.role === 'teacher').map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </optgroup>
            </select>
          </div>
        </header>

        <main className="content">
          {!supabaseConnected && (
            <div className="banner demo">
              <span className="dot" />
              Demo mode — Supabase isn't connected, so changes live in memory only.
              Add <code>.env.local</code> to use your database.
            </div>
          )}

          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/browse" element={<ClassPicker />} />
            <Route path="/courses/manage" element={<TeacherClasses />} />
            <Route path="/courses/:classId/*" element={<CourseLayout />} />
            <Route path="/classes" element={<Navigate to="/courses/browse" replace />} />
            <Route path="/teach" element={<Navigate to="/courses/manage" replace />} />
            <Route path="/homework" element={<Feed />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
