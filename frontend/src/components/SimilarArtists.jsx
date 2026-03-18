export default function SimilarArtists({ artists }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {artists.map(artist => {
        const pct = artist.similarity_score
          ? Math.round(artist.similarity_score * 100)
          : null;

        return (
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
            {pct && (
              <p className="text-xs text-accent mt-1">{pct}% match</p>
            )}
            {artist.popularity && (
              <p className="text-xs text-text-secondary mt-0.5">
                Popularity: {artist.popularity}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
