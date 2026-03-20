import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import EventCard from '../components/EventCard';
import SyncStatus from '../components/SyncStatus';
import { Link } from 'react-router-dom';

const SORT_OPTIONS = [
  { value: 'date', label: 'Date (soonest)' },
  { value: 'distance', label: 'Closest' },
  { value: 'play_weight', label: 'Most listened to' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [matched, setMatched] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('date');

  const needsLocation = !user?.city;

  useEffect(() => {
    if (needsLocation) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const params = sortBy !== 'date' ? `?sort_by=${sortBy}` : '';
    Promise.all([
      api.get(`/events/matched${params}`).catch(() => []),
      api.get(`/events/recommended${params}`).catch(() => []),
    ]).then(([m, r]) => {
      setMatched(m);
      setRecommended(r);
    }).finally(() => setLoading(false));
  }, [needsLocation, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold">Dashboard</h1>
          {user?.city && (
            <p className="text-text-secondary text-sm mt-1">
              Concerts near {user.city}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!needsLocation && (
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-surface-card border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 appearance-none cursor-pointer"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}
          <SyncStatus />
        </div>
      </div>

      {needsLocation ? (
        <div className="glow-card bg-surface-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-text-secondary text-lg mb-6">
            Set your city to find concerts near you
          </p>
          <Link
            to="/settings"
            className="btn-gradient inline-block text-white px-8 py-3 rounded-xl font-semibold"
          >
            Set your location
          </Link>
        </div>
      ) : (
        <>
          {/* Matched Events */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-xl font-bold">Your Matches</h2>
              {matched.length > 0 && (
                <span className="bg-accent/15 text-accent text-xs font-semibold px-2.5 py-1 rounded-full">
                  {matched.length}
                </span>
              )}
            </div>
            {matched.length === 0 ? (
              <div className="bg-surface-card rounded-2xl p-8 text-center border border-white/5">
                <p className="text-text-secondary">
                  No exact matches yet. We'll check again soon!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {matched.map(m => (
                  <EventCard key={m.event_id} event={m} matchType="exact" />
                ))}
              </div>
            )}
          </section>

          {/* Recommended Events */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-xl font-bold">You Might Also Like</h2>
              {recommended.length > 0 && (
                <span className="bg-grad-pink/15 text-grad-pink text-xs font-semibold px-2.5 py-1 rounded-full">
                  {recommended.length}
                </span>
              )}
            </div>
            {recommended.length === 0 ? (
              <div className="bg-surface-card rounded-2xl p-8 text-center border border-white/5">
                <p className="text-text-secondary">
                  Like more artists on Spotify to get recommendations!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {recommended.map(m => (
                  <EventCard key={m.event_id} event={m} matchType="similar" />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
