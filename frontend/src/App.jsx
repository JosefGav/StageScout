import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import SpotifyCallback from './pages/SpotifyCallback';
import Dashboard from './pages/Dashboard';
import EventDetail from './pages/EventDetail';
import MyArtists from './pages/MyArtists';
import Discover from './pages/Discover';
import Settings from './pages/Settings';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/artists', label: 'My Artists', icon: '🎤' },
    { to: '/discover', label: 'Discover', icon: '🔍' },
    { to: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className="w-56 shrink-0 bg-surface-elevated border-r border-surface-hover flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-surface-hover">
        <Link to="/dashboard" className="text-lg font-bold text-accent">
          🎵 Concert Discovery
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map(link => {
          const active = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                active
                  ? 'bg-accent/15 text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="p-4 border-t border-surface-hover">
          <div className="flex items-center gap-2 mb-3">
            {user.avatar_url ? (
              <img src={user.avatar_url} className="w-8 h-8 rounded-full" alt="" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm">
                {user.display_name?.[0] || '?'}
              </div>
            )}
            <span className="text-sm truncate">{user.display_name}</span>
          </div>
          <button
            onClick={logout}
            className="text-xs text-text-secondary hover:text-danger transition"
          >
            Log out
          </button>
        </div>
      )}
    </aside>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/callback" element={<SpotifyCallback />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 p-6 overflow-auto">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/events/:id" element={<EventDetail />} />
                  <Route path="/artists" element={<MyArtists />} />
                  <Route path="/discover" element={<Discover />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
