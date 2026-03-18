import logging
from app.db import query
from app.services import ticketmaster_service, event_service
from app.services.match_service import compute_matches_for_user, cleanup_stale_matches
from app.services.job_service import start_job, complete_job, fail_job

logger = logging.getLogger(__name__)


def fetch_events_job():
    job_id = start_job("fetch_events")
    total_events = 0
    total_matches = 0

    try:
        # Get all users with location set
        users = query("""
            SELECT id, city, latitude, longitude, search_radius_miles
            FROM users WHERE city IS NOT NULL
        """)

        # Get all distinct artist names to search for across all users
        artist_rows = query("""
            SELECT DISTINCT a.name, a.id
            FROM artists a
            WHERE a.id IN (
                SELECT artist_id FROM user_artists
                UNION
                SELECT artist_id FROM user_recommended_artists
            )
        """)

        # Get distinct cities from users
        cities = {}
        for u in users:
            key = u["city"]
            if key and key not in cities:
                cities[key] = {
                    "city": u["city"],
                    "lat": float(u["latitude"]) if u["latitude"] else None,
                    "lng": float(u["longitude"]) if u["longitude"] else None,
                    "radius": u["search_radius_miles"],
                }

        # Search for events by artist in each city
        for artist in artist_rows:
            for city_key, city_info in cities.items():
                try:
                    data = ticketmaster_service.search_events(
                        keyword=artist["name"],
                        lat=city_info["lat"],
                        lng=city_info["lng"],
                        radius=city_info["radius"],
                        size=20,
                    )

                    embedded = data.get("_embedded", {})
                    raw_events = embedded.get("events", [])

                    for raw in raw_events:
                        parsed = ticketmaster_service.parse_event(raw)
                        event_service.upsert_event(parsed)
                        total_events += 1

                except Exception as e:
                    logger.warning(f"Failed to fetch events for {artist['name']} in {city_key}: {e}")
                    continue

        # Clean up matches for cancelled/past events before recomputing
        cleanup_stale_matches()

        # Compute matches for all users
        for u in users:
            try:
                matches = compute_matches_for_user(u["id"])
                total_matches += matches
            except Exception as e:
                logger.warning(f"Failed to compute matches for user {u['id']}: {e}")

        complete_job(job_id, events_fetched=total_events, matches_created=total_matches)
        logger.info(f"Fetch events job complete: {total_events} events, {total_matches} matches")

    except Exception as e:
        logger.error(f"Fetch events job failed: {e}")
        fail_job(job_id, str(e))
