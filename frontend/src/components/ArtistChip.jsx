export default function ArtistChip({ artist }) {
  return (
    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 hover:bg-accent/10 hover:border-accent/20 transition-colors">
      {artist.image_url ? (
        <img
          src={artist.image_url}
          alt={artist.name}
          className="w-6 h-6 rounded-full object-cover"
        />
      ) : (
        <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
          <svg className="w-3 h-3 text-accent" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
          </svg>
        </div>
      )}
      <span className="text-sm font-medium">{artist.name}</span>
      {artist.is_headliner && (
        <span className="text-xs text-warning">★</span>
      )}
    </div>
  );
}
