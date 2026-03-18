import { useEffect, useState } from 'react';
import { api } from '../api/client';
import SimilarArtists from '../components/SimilarArtists';

export default function Discover() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/artists/me/recommended')
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
      <h1 className="text-2xl font-bold mb-2">Discover</h1>
      <p className="text-text-secondary mb-6">
        Artists similar to your taste, ranked by audio similarity to your listening profile.
      </p>

      {artists.length === 0 ? (
        <div className="bg-surface-elevated rounded-lg p-8 text-center">
          <p className="text-text-secondary">
            No recommendations yet. Sync your Spotify library to get started.
          </p>
        </div>
      ) : (
        <SimilarArtists artists={artists} />
      )}
    </div>
  );
}
