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
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-text-secondary text-lg">Event not found.</p>
        <Link to="/dashboard" className="text-accent hover:text-accent-hover text-sm mt-4 inline-block">
          ← Back to Dashboard
        </Link>
      </div>
    );
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
    <div className="max-w-3xl">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-text-secondary hover:text-accent text-sm mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </Link>

      <div className="glow-card bg-surface-card rounded-2xl overflow-hidden">
        {/* Hero image */}
        {event.image_url && (
          <div className="relative h-72 md:h-80">
            <img
              src={event.image_url}
              alt={event.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-surface-card/50 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <h1 className="text-3xl md:text-4xl font-extrabold drop-shadow-lg">{event.name}</h1>
            </div>
          </div>
        )}

        <div className="p-6 md:p-8">
          {!event.image_url && (
            <h1 className="text-3xl font-extrabold mb-4">{event.name}</h1>
          )}

          {/* Info pills */}
          <div className="flex flex-wrap gap-3 mb-8">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm">
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{date}{time && `, ${time}`}</span>
            </div>
            {event.venue_name && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{event.venue_name} — {event.venue_city}{event.venue_state ? `, ${event.venue_state}` : ''}</span>
              </div>
            )}
            {(event.price_min || event.price_max) && (
              <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-xl px-4 py-2.5 text-sm font-semibold text-accent">
                <span>${event.price_min ?? '?'} – ${event.price_max ?? '?'}</span>
              </div>
            )}
          </div>

          {/* Matched artists */}
          {event.matched_artists && event.matched_artists.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Your Matches
              </h2>
              <div className="space-y-3">
                {event.matched_artists.map(a => (
                  <div key={a.id} className="flex items-start gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
                    {a.image_url && (
                      <img src={a.image_url} alt={a.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-accent/30 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-accent font-semibold text-sm">{a.name}</p>
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

          {/* All artists */}
          {event.artists && event.artists.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-grad-amber" />
                All Artists
              </h2>
              <div className="flex flex-wrap gap-2">
                {event.artists.map(a => (
                  <ArtistChip key={a.id} artist={a} />
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          {event.ticket_url && (
            <a
              href={event.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gradient inline-flex items-center gap-2 text-white px-8 py-3.5 rounded-xl font-semibold text-base"
            >
              Get Tickets
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
