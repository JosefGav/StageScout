import { Link } from 'react-router-dom';
import MatchBadge from './MatchBadge';

export default function EventCard({ event, matchType }) {
  const id = event.event_id || event.id;
  const name = event.event_name || event.name;
  const date = event.event_date;
  const image = event.image_url;
  const venueName = event.venue_name;
  const venueCity = event.venue_city;
  const matchedArtists = event.matched_artists || [];
  const artistName = matchedArtists.length > 0
    ? matchedArtists.map(a => a.name).join(', ')
    : event.artist_name;
  const similarity = event.similarity_score;

  const dateObj = date ? new Date(date) : null;
  const month = dateObj
    ? dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
    : null;
  const day = dateObj ? dateObj.getDate() : null;
  const dateStr = dateObj
    ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'TBD';

  return (
    <Link
      to={`/events/${id}`}
      className="group glow-card bg-surface-card rounded-2xl overflow-hidden transition-all duration-300 block hover:scale-[1.02] hover:shadow-[0_8px_32px_rgba(255,90,54,0.15)]"
    >
      {/* Image section with overlay */}
      <div className="relative h-44 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent/20 to-grad-amber/20 flex items-center justify-center">
            <svg className="w-12 h-12 text-accent/40" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
            </svg>
          </div>
        )}
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-surface-card/40 to-transparent" />

        {/* Date badge */}
        {dateObj && (
          <div className="absolute top-3 left-3 bg-surface/80 backdrop-blur-sm rounded-xl px-2.5 py-1.5 text-center min-w-[48px] border border-white/10">
            <p className="text-[10px] font-bold text-accent leading-none tracking-wider">{month}</p>
            <p className="text-lg font-bold leading-tight">{day}</p>
          </div>
        )}

        {/* Match badge */}
        <div className="absolute top-3 right-3">
          <MatchBadge type={matchType || event.match_type} similarity={similarity} matchQuality={event.match_quality} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pt-2">
        <h3 className="font-bold text-sm leading-tight line-clamp-2 mb-1.5 group-hover:text-accent transition-colors">
          {name}
        </h3>
        {matchedArtists.length > 0 ? (
          <div className="mb-1">
            {matchedArtists.map(a => (
              <p key={a.id} className="text-accent/80 text-xs font-medium">{a.name}</p>
            ))}
          </div>
        ) : artistName ? (
          <p className="text-accent/80 text-xs font-medium mb-1">{artistName}</p>
        ) : null}

        <div className="flex items-center gap-1.5 text-text-secondary text-xs">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">
            {venueName ? `${venueName}${venueCity ? ` — ${venueCity}` : ''}` : dateStr}
          </span>
        </div>

        {(event.price_min || event.price_max) && (
          <p className="text-accent text-xs font-semibold mt-2">
            ${event.price_min ?? '?'} – ${event.price_max ?? '?'}
          </p>
        )}
      </div>
    </Link>
  );
}
