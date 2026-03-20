import { useEffect, useState } from 'react';
import { api } from '../api/client';
import SimilarArtists from '../components/SimilarArtists';
import EventCard from '../components/EventCard';

export default function Discover() {
  const [artists, setArtists] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/artists/me/recommended').catch(() => []),
      api.get('/events/recommended').catch(() => []),
    ]).then(([a, e]) => {
      setArtists(a);
      setEvents(e);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const hasContent = artists.length > 0 || events.length > 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Discover</h1>
      <p className="text-text-secondary mb-6">
        Concerts and artists recommended based on your listening profile.
      </p>

      {!hasContent ? (
        <div className="bg-surface-elevated rounded-lg p-8 text-center">
          <p className="text-text-secondary">
            No recommendations yet. Sync your Spotify library to get started.
          </p>
        </div>
      ) : (
        <>
          {events.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold mb-4">Recommended Concerts</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map(e => (
                  <EventCard key={e.event_id} event={e} matchType="similar" />
                ))}
              </div>
            </section>
          )}

          {artists.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">Recommended Artists</h2>
              <SimilarArtists artists={artists} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
