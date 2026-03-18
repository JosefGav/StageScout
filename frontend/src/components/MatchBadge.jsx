export default function MatchBadge({ type, similarity, matchQuality }) {
  if (type === 'exact') {
    const isConfirmed = matchQuality === 'exact_name';
    return (
      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
        isConfirmed
          ? 'bg-success/20 text-success'
          : 'bg-warning/20 text-warning'
      }`}>
        {isConfirmed ? 'Confirmed' : 'Possibly Tribute'}
      </span>
    );
  }

  if (type === 'similar' && similarity) {
    const pct = Math.round(similarity * 100);
    return (
      <span className="shrink-0 bg-accent/20 text-accent text-xs px-2 py-0.5 rounded-full font-medium">
        Similar ({pct}%)
      </span>
    );
  }

  return null;
}
