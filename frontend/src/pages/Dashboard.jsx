import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import EventCard from '../components/EventCard';
import SyncStatus from '../components/SyncStatus';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [matched, setMatched] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  const needsLocation = !user?.city;

  useEffect(() => {
    if (needsLocation) {
      setLoading(false);
      return;
    }
    Promise.all([
      api.get('/events/matched').catch(() => []),
      api.get('/events/recommended').catch(() => []),
    ]).then(([m, r]) => {
      setMatched(m);
      setRecommended(r);
    }).finally(() => setLoading(false));
  }, [needsLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <SyncStatus />
      </div>

      {needsLocation ? (
        <div className="bg-surface-elevated rounded-lg p-8 text-center">
          <p className="text-text-secondary text-lg mb-4">
            Set your city to find concerts near you
          </p>
          <Link
            to="/settings"
            className="inline-block bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded-lg transition"
          >
            Set your location
          </Link>
        </div>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Your Matches
              {matched.length > 0 && (
                <span className="ml-2 text-sm font-normal text-text-secondary">
                  ({matched.length})
                </span>
              )}
            </h2>
            {matched.length === 0 ? (
              <p className="text-text-secondary">
                No exact matches yet. We'll check again soon!
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matched.map(m => (
                  <EventCard key={m.event_id} event={m} matchType="exact" />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">
              You Might Also Like
              {recommended.length > 0 && (
                <span className="ml-2 text-sm font-normal text-text-secondary">
                  ({recommended.length})
                </span>
              )}
            </h2>
            {recommended.length === 0 ? (
              <p className="text-text-secondary">
                Like more artists on Spotify to get recommendations!
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
