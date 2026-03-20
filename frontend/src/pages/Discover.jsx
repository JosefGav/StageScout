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
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  const hasContent = artists.length > 0 || events.length > 0;

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2">Discover</h1>
        <p className="text-text-secondary">
          Concerts and artists recommended based on your listening profile.
        </p>
      </div>

      {!hasContent ? (
        <div className="glow-card bg-surface-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-text-secondary text-lg">
            No recommendations yet. Sync your Spotify library to get started.
          </p>
        </div>
      ) : (
        <>
          {events.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-xl font-bold">Recommended Concerts</h2>
                <span className="bg-accent/15 text-accent text-xs font-semibold px-2.5 py-1 rounded-full">
                  {events.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {events.map(e => (
                  <EventCard key={e.event_id} event={e} matchType="similar" />
                ))}
              </div>
            </section>
          )}

          {artists.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-xl font-bold">Recommended Artists</h2>
                <span className="bg-grad-pink/15 text-grad-pink text-xs font-semibold px-2.5 py-1 rounded-full">
                  {artists.length}
                </span>
              </div>
              <SimilarArtists artists={artists} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
