export default function MatchBadge({ type, similarity, matchQuality }) {
  if (type === 'exact') {
    const isConfirmed = matchQuality === 'exact_name';
    return (
      <span className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm border ${
        isConfirmed
          ? 'bg-success/15 text-success border-success/20'
          : 'bg-warning/15 text-warning border-warning/20'
      }`}>
        {isConfirmed ? 'Confirmed' : 'Possibly Tribute'}
      </span>
    );
  }

  if (type === 'similar' && similarity) {
    const pct = Math.round(similarity * 100);
    return (
      <span className="shrink-0 bg-accent/15 text-accent text-[11px] px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm border border-accent/20">
        {pct}% Match
      </span>
    );
  }

  return null;
}
