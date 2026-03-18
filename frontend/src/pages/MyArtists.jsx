import { useEffect, useState } from 'react';
import { api } from '../api/client';
import ArtistChip from '../components/ArtistChip';

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
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        My Artists
        <span className="ml-2 text-sm font-normal text-text-secondary">
          ({artists.length})
        </span>
      </h1>

      {artists.length === 0 ? (
        <p className="text-text-secondary">
          No artists synced yet. Trigger a sync from Settings.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {artists.map(artist => (
            <div
              key={artist.id}
              className="bg-surface-elevated rounded-lg p-4 text-center hover:bg-surface-hover transition"
            >
              {artist.image_url ? (
                <img
                  src={artist.image_url}
                  alt={artist.name}
                  className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full mx-auto mb-3 bg-surface-hover flex items-center justify-center text-2xl">
                  🎤
                </div>
              )}
              <p className="font-medium text-sm truncate">{artist.name}</p>
              {artist.event_count > 0 && (
                <p className="text-xs text-accent mt-1">
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
