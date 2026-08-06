import { Suspense, lazy } from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useApp } from './context/AppContext';
import Dashboard from './pages/Dashboard';
import Feed from './pages/Feed';
import SignIn from './pages/SignIn';
import Icon, { BrandMark, type IconName } from './components/Icon';

// Everything past the two screens students open first is split out, so a phone
// on school wifi downloads a fraction of the app up front.
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const CoursesPage = lazy(() => import('./pages/CoursesPage'));
const Discussions = lazy(() => import('./pages/Discussions'));
const ClassPicker = lazy(() => import('./pages/ClassPicker'));
const TeacherClasses = lazy(() => import('./pages/TeacherClasses'));
const ImportClassroom = lazy(() => import('./pages/ImportClassroom'));
const Counselor = lazy(() => import('./pages/Counselor'));
const Family = lazy(() => import('./pages/Family'));
const CourseLayout = lazy(() => import('./pages/course/CourseLayout'));

interface NavItem {
  to: string;
  glyph: IconName;
  label: string;
}

const STUDENT_TEACHER_NAV: NavItem[] = [
  { to: '/dashboard', glyph: 'home', label: 'Dashboard' },
  { to: '/courses', glyph: 'courses', label: 'Courses' },
  { to: '/calendar', glyph: 'calendar', label: 'Calendar' },
  { to: '/discussions', glyph: 'discussions', label: 'Discussions' },
  { to: '/homework', glyph: 'checklist', label: 'To Do' },
];

const COUNSELOR_NAV: NavItem[] = [
  { to: '/counselor', glyph: 'compass', label: 'Counselor' },
  { to: '/calendar', glyph: 'calendar', label: 'Calendar' },
];

// Guardians get one read-only screen; nothing here is theirs to edit.
const PARENT_NAV: NavItem[] = [{ to: '/family', glyph: 'family', label: 'Family' }];

export default function App() {
  const {
    loading,
    error,
    currentUser,
    profiles,
    currentUserId,
    setCurrentUserId,
    supabaseConnected,
    authEnabled,
    authUser,
    authLoading,
    signOut,
  } = useApp();

  if (loading || authLoading) return <div className="center-screen">Loading Homework Hub…</div>;

  // With Supabase connected, nothing is reachable until you sign in.
  if (authEnabled && !authUser) return <SignIn />;

  // Signed in with an address the school hasn't set up yet. Better to say so
  // than to show an app with no classes in it and let them wonder.
  if (authEnabled && authUser && !currentUser) {
    return (
      <div className="center-screen">
        <div className="card signin-card">
          <h1 style={{ marginTop: 0 }}>Almost there</h1>
          <p>
            {authUser.email} isn't set up in Homework Hub yet, so there's nothing
            to show. Ask the school office to add it and try again.
          </p>
          <button className="btn secondary" onClick={signOut}>Sign out</button>
        </div>
      </div>
    );
  }

  // The fix for demo mode differs by where the app is running: a local dev
  // server reads .env.local, but a deployed site never sees that file — telling
  // a visitor on duesis.com to add one sends them somewhere with no effect.
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);

  const isCounselor = currentUser?.role === 'counselor';
  const isParent = currentUser?.role === 'parent';
  const home = isCounselor ? '/counselor' : isParent ? '/family' : '/dashboard';
  const nav = isCounselor ? COUNSELOR_NAV : isParent ? PARENT_NAV : STUDENT_TEACHER_NAV;

  return (
    <div className="app-shell rail-layout">
      <aside className="global-rail">
        <div className="rail-brand" title="Homework Hub">
          <BrandMark />
        </div>
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `rail-item ${isActive ? 'active' : ''}`}
          >
            <span className="rail-glyph"><Icon name={item.glyph} size="1.3rem" /></span>
            <span className="rail-label">{item.label}</span>
          </NavLink>
        ))}
      </aside>

      <div className="rail-main">
        <header className="topbar">
          <div className="brand">
            <BrandMark size="20" />
            <span className="name">Homework Hub</span>
            <span className="chip" style={{ marginLeft: '0.5rem' }}>
              {currentUser?.role ?? '—'}
            </span>
          </div>
          <div className="topbar-spacer" />
          {authEnabled ? (
            <div className="user-switcher">
              <span className="meta">{currentUser?.name}</span>
              <button className="btn secondary small" onClick={signOut}>Sign out</button>
            </div>
          ) : (
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
              <optgroup label="Parents">
                {profiles.filter((p) => p.role === 'parent').map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </optgroup>
              <optgroup label="Counselors">
                {profiles.filter((p) => p.role === 'counselor').map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </optgroup>
            </select>
          </div>
          )}
        </header>

        <main className="content">
          {error && (
            <div className="banner error" role="alert">
              <span className="dot" />
              Couldn't load your data: {error}
            </div>
          )}

          {!supabaseConnected && (
            <div className="banner demo">
              <span className="dot" />
              Demo mode — no database connected, so changes live in memory only.{' '}
              {isLocal ? (
                <>Add <code>.env.local</code> to use your database.</>
              ) : (
                <>
                  Set <code>VITE_SUPABASE_URL</code> and{' '}
                  <code>VITE_SUPABASE_ANON_KEY</code> in this site's hosting
                  settings, then redeploy.
                </>
              )}
            </div>
          )}

          <Suspense fallback={<div className="center-screen">Loading…</div>}>
          {/*
            Only the routes a role is allowed to open are declared, so anything
            else falls through to "*" and lands them back on their own home.
            Switching accounts doesn't navigate on its own — without this, a
            guardian who switched over on /dashboard would sit there looking at
            a student's checklist.
          */}
          <Routes>
            <Route path="/" element={<Navigate to={home} replace />} />
            {isParent ? (
              <Route path="/family" element={<Family />} />
            ) : isCounselor ? (
              <>
                <Route path="/counselor" element={<Counselor />} />
                <Route path="/calendar" element={<CalendarPage />} />
              </>
            ) : (
              <>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/courses/browse" element={<ClassPicker />} />
                <Route path="/courses/manage" element={<TeacherClasses />} />
                <Route path="/courses/import" element={<ImportClassroom />} />
                <Route path="/courses/:classId/*" element={<CourseLayout />} />
                <Route path="/classes" element={<Navigate to="/courses/browse" replace />} />
                <Route path="/teach" element={<Navigate to="/courses/manage" replace />} />
                <Route path="/homework" element={<Feed />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/discussions" element={<Discussions />} />
                <Route path="/inbox" element={<Navigate to="/discussions" replace />} />
              </>
            )}
            <Route path="*" element={<Navigate to={home} replace />} />
          </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
