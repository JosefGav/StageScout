import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import ArtistChip from '../components/ArtistChip';

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/events/${id}`)
      .then(setEvent)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!event) {
    return <p className="text-text-secondary">Event not found.</p>;
  }

  const date = event.event_date
    ? new Date(event.event_date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : 'TBD';

  const time = event.event_date
    ? new Date(event.event_date).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit',
      })
    : '';

  return (
    <div>
      <Link to="/dashboard" className="text-accent hover:text-accent-hover text-sm mb-4 inline-block">
        ← Back to Dashboard
      </Link>

      <div className="bg-surface-elevated rounded-lg overflow-hidden">
        {event.image_url && (
          <img
            src={event.image_url}
            alt={event.name}
            className="w-full h-64 object-cover"
          />
        )}
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-2">{event.name}</h1>

          <div className="flex flex-wrap gap-4 text-text-secondary mb-6">
            <span>📅 {date} {time && `at ${time}`}</span>
            {event.venue_name && (
              <span>📍 {event.venue_name} — {event.venue_city}{event.venue_state ? `, ${event.venue_state}` : ''}</span>
            )}
            {(event.price_min || event.price_max) && (
              <span>💰 ${event.price_min ?? '?'} – ${event.price_max ?? '?'}</span>
            )}
          </div>

          {event.matched_artists && event.matched_artists.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Your Matches</h2>
              <div className="space-y-3">
                {event.matched_artists.map(a => (
                  <div key={a.id} className="flex items-start gap-3">
                    {a.image_url && (
                      <img src={a.image_url} alt={a.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-accent font-medium text-sm">{a.name}</p>
                      {a.tracks && a.tracks.length > 0 && (
                        <p className="text-text-secondary text-xs mt-0.5">
                          Your songs: {a.tracks.slice(0, 5).join(', ')}
                          {a.tracks.length > 5 && ` +${a.tracks.length - 5} more`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {event.artists && event.artists.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">All Artists</h2>
              <div className="flex flex-wrap gap-2">
                {event.artists.map(a => (
                  <ArtistChip key={a.id} artist={a} />
                ))}
              </div>
            </div>
          )}

          {event.ticket_url && (
            <a
              href={event.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-lg font-medium transition"
            >
              Get Tickets →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
