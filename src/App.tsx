import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useApp } from './context/AppContext';
import ClassPicker from './pages/ClassPicker';
import Feed from './pages/Feed';
import CalendarPage from './pages/CalendarPage';
import TeacherClasses from './pages/TeacherClasses';

export default function App() {
  const { loading, currentUser, profiles, currentUserId, setCurrentUserId, supabaseConnected } =
    useApp();

  if (loading) return <div className="center-screen">Loading Homework Hub…</div>;

  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="glyph">🗓️</span>
          <span className="name">Homework Hub</span>
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

      <nav className="nav">
        {isStudent && (
          <NavLink to="/classes" className={({ isActive }) => (isActive ? 'active' : '')}>
            My Classes
          </NavLink>
        )}
        {isTeacher && (
          <NavLink to="/teach" className={({ isActive }) => (isActive ? 'active' : '')}>
            My Classes
          </NavLink>
        )}
        <NavLink to="/homework" className={({ isActive }) => (isActive ? 'active' : '')}>
          Homework
        </NavLink>
        <NavLink to="/calendar" className={({ isActive }) => (isActive ? 'active' : '')}>
          Calendar
        </NavLink>
      </nav>

      <main className="content">
        {!supabaseConnected && (
          <div className="banner demo">
            <span className="dot" />
            Demo mode — Supabase isn't connected, so changes live in memory only.
            Add <code>.env.local</code> to use your database.
          </div>
        )}

        <Routes>
          <Route path="/" element={<Navigate to={isTeacher ? '/teach' : '/homework'} replace />} />
          <Route path="/classes" element={<ClassPicker />} />
          <Route path="/teach" element={<TeacherClasses />} />
          <Route path="/homework" element={<Feed />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="*" element={<Navigate to="/homework" replace />} />
        </Routes>
      </main>
    </div>
  );
}
