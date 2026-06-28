import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useApp } from './context/AppContext';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Recommendations from './pages/Recommendations';
import MyMentoring from './pages/MyMentoring';
import Points from './pages/Points';
import Coordinator from './pages/Coordinator';

export default function App() {
  const { loading, currentUser, profiles, currentUserId, setCurrentUserId, supabaseConnected } =
    useApp();

  if (loading) {
    return <div className="center-screen">Loading Yeon…</div>;
  }

  const isCoordinator = currentUser?.role === 'coordinator';

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="glyph">緣</span>
          <span className="name">Yeon</span>
          <span className="tagline">Learning, connected.</span>
        </div>
        <div className="topbar-spacer" />
        <div className="user-switcher">
          <label htmlFor="user">Viewing as</label>
          <select
            id="user"
            value={currentUserId ?? ''}
            onChange={(e) => setCurrentUserId(e.target.value)}
          >
            <optgroup label="Coordinator">
              {profiles
                .filter((p) => p.role === 'coordinator')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Mentors">
              {profiles
                .filter((p) => p.role === 'mentor')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · G{p.grade}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Mentees">
              {profiles
                .filter((p) => p.role === 'mentee')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · G{p.grade}
                  </option>
                ))}
            </optgroup>
          </select>
        </div>
      </header>

      <nav className="nav">
        <NavLink to="/recommendations" className={({ isActive }) => (isActive ? 'active' : '')}>
          {isCoordinator ? 'Matchmaking' : 'Matches for me'}
        </NavLink>
        <NavLink to="/mentoring" className={({ isActive }) => (isActive ? 'active' : '')}>
          My Mentoring
        </NavLink>
        <NavLink to="/points" className={({ isActive }) => (isActive ? 'active' : '')}>
          Points
        </NavLink>
        {isCoordinator && (
          <NavLink to="/coordinator" className={({ isActive }) => (isActive ? 'active' : '')}>
            Coordinator
          </NavLink>
        )}
        <NavLink to="/profile" className={({ isActive }) => (isActive ? 'active' : '')}>
          Profile
        </NavLink>
        <NavLink to="/onboarding" className={({ isActive }) => (isActive ? 'active' : '')}>
          Join
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
          <Route path="/" element={<Navigate to="/recommendations" replace />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/mentoring" element={<MyMentoring />} />
          <Route path="/points" element={<Points />} />
          <Route path="/coordinator" element={<Coordinator />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="*" element={<Navigate to="/recommendations" replace />} />
        </Routes>
      </main>
    </div>
  );
}
