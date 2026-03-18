import { Link } from 'react-router-dom';
import MatchBadge from './MatchBadge';

export default function EventCard({ event, matchType }) {
  const eventData = event.event_id ? event : event;
  const id = event.event_id || event.id;
  const name = event.event_name || event.name;
  const date = event.event_date;
  const image = event.image_url;
  const venueName = event.venue_name;
  const venueCity = event.venue_city;
  const artistName = event.artist_name;
  const similarity = event.similarity_score;

  const dateStr = date
    ? new Date(date).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : 'TBD';

  return (
    <Link
      to={`/events/${id}`}
      className="bg-surface-elevated rounded-lg overflow-hidden hover:bg-surface-hover transition block"
    >
      {image && (
        <img src={image} alt={name} className="w-full h-40 object-cover" />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">
            {name}
          </h3>
          <MatchBadge type={matchType || event.match_type} similarity={similarity} />
        </div>
        {artistName && (
          <p className="text-accent text-xs mb-1">{artistName}</p>
        )}
        <p className="text-text-secondary text-xs">{dateStr}</p>
        {venueName && (
          <p className="text-text-secondary text-xs">
            {venueName}{venueCity ? ` — ${venueCity}` : ''}
          </p>
        )}
        {(event.price_min || event.price_max) && (
          <p className="text-text-secondary text-xs mt-1">
            ${event.price_min ?? '?'} – ${event.price_max ?? '?'}
          </p>
        )}
      </div>
    </Link>
  );
}
