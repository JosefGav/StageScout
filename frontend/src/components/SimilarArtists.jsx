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
            className="group glow-card bg-surface-card rounded-2xl p-5 text-center hover:scale-[1.03] transition-all duration-300 cursor-default"
          >
            {artist.image_url ? (
              <img
                src={artist.image_url}
                alt={artist.name}
                className="w-20 h-20 rounded-full mx-auto mb-3 object-cover ring-2 ring-white/10 group-hover:ring-accent/40 transition-all"
              />
            ) : (
              <div className="w-20 h-20 rounded-full mx-auto mb-3 bg-gradient-to-br from-accent/20 to-grad-amber/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-accent/50" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                </svg>
              </div>
            )}
            <p className="font-semibold text-sm truncate">{artist.name}</p>
            {pct && (
              <p className="text-xs text-accent font-medium mt-1">{pct}% match</p>
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
