export default function ArtistChip({ artist }) {
  return (
    <div className="inline-flex items-center gap-2 bg-surface-hover rounded-full px-3 py-1.5">
      {artist.image_url ? (
        <img
          src={artist.image_url}
          alt={artist.name}
          className="w-6 h-6 rounded-full object-cover"
        />
      ) : (
        <div className="w-6 h-6 rounded-full bg-surface flex items-center justify-center text-xs">
          🎤
        </div>
      )}
      <span className="text-sm font-medium">{artist.name}</span>
      {artist.is_headliner && (
        <span className="text-xs text-warning">★</span>
      )}
    </div>
  );
}
