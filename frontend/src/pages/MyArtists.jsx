import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function MyArtists() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/artists/me')
      .then(setArtists)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-3xl font-extrabold">My Artists</h1>
        {artists.length > 0 && (
          <span className="bg-accent/15 text-accent text-xs font-semibold px-2.5 py-1 rounded-full">
            {artists.length}
          </span>
        )}
      </div>

      {artists.length === 0 ? (
        <div className="glow-card bg-surface-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-accent" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
            </svg>
          </div>
          <p className="text-text-secondary text-lg">
            No artists synced yet. Trigger a sync from Settings.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {artists.map(artist => (
            <div
              key={artist.id}
              className="group glow-card bg-surface-card rounded-2xl p-5 text-center hover:scale-[1.03] transition-all duration-300"
            >
              {artist.image_url ? (
                <img
                  src={artist.image_url}
                  alt={artist.name}
                  className="w-20 h-20 rounded-full mx-auto mb-3 object-cover ring-2 ring-white/10 group-hover:ring-accent/40 transition-all"
                />
              ) : (
                <div className="w-20 h-20 rounded-full mx-auto mb-3 bg-gradient-to-br from-accent/20 to-grad-pink/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-accent/50" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                  </svg>
                </div>
              )}
              <p className="font-semibold text-sm truncate">{artist.name}</p>
              {artist.event_count > 0 && (
                <p className="text-xs text-accent font-medium mt-1">
                  {artist.event_count} upcoming event{artist.event_count !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
