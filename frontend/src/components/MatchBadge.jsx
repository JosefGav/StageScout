export default function MatchBadge({ type, similarity }) {
  if (type === 'exact') {
    return (
      <span className="shrink-0 bg-success/20 text-success text-xs px-2 py-0.5 rounded-full font-medium">
        Exact Match
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
