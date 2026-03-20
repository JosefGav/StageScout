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
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  return children;
}

const NAV_LINKS = [
  {
    to: '/dashboard', label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
      </svg>
    ),
  },
  {
    to: '/artists', label: 'My Artists',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
      </svg>
    ),
  },
  {
    to: '/discover', label: 'Discover',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    to: '/settings', label: 'Settings',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="w-60 shrink-0 bg-surface-elevated/60 backdrop-blur-xl border-r border-white/5 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 pb-4">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-grad-amber flex items-center justify-center">
            <svg className="w-[18px] h-[18px] text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Light beams */}
              <polygon points="5,2 2,14 8,14" fill="currentColor" opacity="0.35" />
              <polygon points="12,1 9,14 15,14" fill="currentColor" opacity="0.55" />
              <polygon points="19,2 16,14 22,14" fill="currentColor" opacity="0.35" />
              {/* Stage platform */}
              <rect x="1" y="17" width="22" height="3" rx="1" fill="currentColor" />
              {/* Stage edge highlight */}
              <line x1="3" y1="17" x2="21" y2="17" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
              {/* Spotlight heads */}
              <circle cx="5" cy="2" r="1.5" fill="currentColor" />
              <circle cx="12" cy="1" r="1.8" fill="currentColor" />
              <circle cx="19" cy="2" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <span className="text-lg font-bold text-gradient">StageScout</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_LINKS.map(link => {
          const active = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-accent/15 text-accent shadow-[inset_0_0_0_1px_rgba(255,90,54,0.15)]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      {user && (
        <div className="p-4 mx-3 mb-3 rounded-xl bg-white/5 border border-white/5">
          <div className="flex items-center gap-2.5 mb-2.5">
            {user.avatar_url ? (
              <img src={user.avatar_url} className="w-9 h-9 rounded-full ring-2 ring-accent/30" alt="" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-grad-amber flex items-center justify-center text-sm font-semibold text-white">
                {user.display_name?.[0] || '?'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.display_name}</p>
              <p className="text-xs text-text-secondary truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-xs text-text-secondary hover:text-danger transition w-full text-left"
          >
            Log out
          </button>
        </div>
      )}
    </aside>
  );
}

function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-elevated/80 backdrop-blur-xl border-t border-white/5 px-2 py-1 flex justify-around md:hidden">
      {NAV_LINKS.map(link => {
        const active = location.pathname === link.to;
        return (
          <Link
            key={link.to}
            to={link.to}
            className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg text-xs transition ${
              active ? 'text-accent' : 'text-text-secondary'
            }`}
          >
            {link.icon}
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
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
              <div className="hidden md:block">
                <Sidebar />
              </div>
              <main className="flex-1 p-4 md:p-8 overflow-auto pb-20 md:pb-8">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/events/:id" element={<EventDetail />} />
                  <Route path="/artists" element={<MyArtists />} />
                  <Route path="/discover" element={<Discover />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
              <MobileNav />
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
