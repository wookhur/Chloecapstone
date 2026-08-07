import { Suspense, lazy } from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { isDemoRequested } from './lib/supabase';
import Dashboard from './pages/Dashboard';
import Feed from './pages/Feed';
import SignIn from './pages/SignIn';
import Icon, { BrandMark, type IconName } from './components/Icon';
import Skeleton from './components/Skeleton';

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

  // Auth settles first, and it decides which of two unrelated screens is
  // coming — the app, or the sign-in card. Blocking out the shape of one before
  // that's known just means redrawing the page when the guess turns out wrong,
  // so this stretch stays plain and the skeleton waits until there's something
  // certain to stand in for.
  if (authLoading) {
    return <div className="center-screen" role="status">Loading Homework Hub…</div>;
  }

  // With Supabase connected, nothing is reachable until you sign in.
  if (authEnabled && !authUser) return <SignIn />;

  // Now the destination is known, so the wait can show the page that's coming.
  // This has to sit above the check below: mid-load there is no currentUser
  // yet, and without it a student would be told their account doesn't exist
  // for the second or two before their own data arrives.
  // The rail and the topbar are drawn for real here, not blocked out: they're
  // the same whatever the data turns out to say, so putting them up front means
  // the page arriving underneath doesn't shove everything sideways. Only the
  // nav items wait, since which ones there are depends on who you are.
  if (loading) {
    return (
      <div className="app-shell rail-layout">
        <aside className="global-rail">
          <div className="rail-brand" title="Homework Hub"><BrandMark /></div>
        </aside>
        <div className="rail-main">
          <header className="topbar">
            <div className="brand">
              <BrandMark size="20" />
              <span className="name">Homework Hub</span>
            </div>
          </header>
          <main className="content"><Skeleton /></main>
        </div>
      </div>
    );
  }

  // Signed in with an address the school hasn't set up yet. Better to say so
  // than to show an app with no classes in it and let them wonder.
  if (authEnabled && authUser && !currentUser) {
    return (
      <div className="signin-screen">
        <main className="signin-card">
          <div className="signin-lockup">
            <span className="signin-mark" aria-hidden="true"><BrandMark size="26" /></span>
            <h1>Homework Hub</h1>
          </div>
          <div className="signin-sent">
            <span className="signin-sent-mark is-waiting" aria-hidden="true">
              <Icon name="info" size="1.35rem" />
            </span>
            <h2>Not set up yet</h2>
            {/* The address gets its own line. Inline in centred prose, a long
                email wraps mid-word and drags the sentence apart. */}
            <p className="signin-address">{authUser.email}</p>
            <p>
              That address isn't on the school's list, so there are no classes
              to show. Ask the office to add it, then sign in again.
            </p>
            <button className="btn secondary" onClick={signOut}>Sign out</button>
          </div>
        </main>
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
      <a className="skip-link" href="#main">Skip to content</a>
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
            <span className="chip ml-2">
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

        <main className="content" id="main" tabIndex={-1}>
          {error && (
            <div className="banner error" role="alert">
              <span className="dot" />
              Couldn't load your data: {error}
            </div>
          )}

          {!supabaseConnected && (
            <div className="banner demo">
              <span className="dot" />
              {isDemoRequested ? (
                /* Someone opened this on purpose to look around. Say so plainly
                   — the worst outcome would be a teacher believing these are
                   their real classes. */
                <>
                  <strong>Sample data.</strong> Everyone and everything here is
                  made up, and nothing you change is saved. Switch accounts
                  above to see it as a student, a teacher, a counsellor or a
                  parent. <a href="?demo=0">Leave the demo</a>
                </>
              ) : isLocal ? (
                <>
                  Demo mode — no database connected, so changes live in memory
                  only. Add <code>.env.local</code> to use your database.
                </>
              ) : (
                <>
                  Demo mode — no database connected, so changes live in memory
                  only. Set <code>VITE_SUPABASE_URL</code> and{' '}
                  <code>VITE_SUPABASE_ANON_KEY</code> in this site's hosting
                  settings, then redeploy.
                </>
              )}
            </div>
          )}

          <Suspense fallback={<Skeleton rows={2} />}>
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
