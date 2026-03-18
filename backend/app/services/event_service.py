from app.db import query, query_one, execute
from app.constants import (
    EVENT_SORT_FIELDS, EVENT_SORT_DIRS, DEFAULT_EVENT_SORT, DEFAULT_SORT_DIR,
    DEFAULT_PAGE, DEFAULT_PER_PAGE, normalize_artist_name, SIMILARITY_THRESHOLD
)
import math


def upsert_venue(venue_data: dict) -> int | None:
    if not venue_data:
        return None

    tm_id = venue_data.get("ticketmaster_id")
    if tm_id:
        existing = query_one("SELECT id FROM venues WHERE ticketmaster_id = %s", (tm_id,))
        if existing:
            execute("""
                UPDATE venues SET name=%s, city=%s, state=%s, country=%s,
                    latitude=%s, longitude=%s, address=%s
                WHERE ticketmaster_id = %s
            """, (venue_data["name"], venue_data.get("city"), venue_data.get("state"),
                  venue_data.get("country", "US"), venue_data.get("latitude"),
                  venue_data.get("longitude"), venue_data.get("address"), tm_id))
            return existing["id"]

    execute("""
        INSERT INTO venues (ticketmaster_id, name, city, state, country, latitude, longitude, address)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (ticketmaster_id) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
    """, (tm_id, venue_data["name"], venue_data.get("city"), venue_data.get("state"),
          venue_data.get("country", "US"), venue_data.get("latitude"),
          venue_data.get("longitude"), venue_data.get("address")))
    row = query_one("SELECT id FROM venues WHERE ticketmaster_id = %s", (tm_id,))
    return row["id"] if row else None


def upsert_event(event_data: dict) -> dict:
    venue_id = upsert_venue(event_data.get("venue"))
    tm_id = event_data["ticketmaster_id"]

    existing = query_one("SELECT id FROM events WHERE ticketmaster_id = %s", (tm_id,))
    if existing:
        execute("""
            UPDATE events SET name=%s, event_date=%s, on_sale_date=%s,
                price_min=%s, price_max=%s, ticket_url=%s, image_url=%s,
                venue_id=%s, status=%s, fetched_at=NOW()
            WHERE ticketmaster_id = %s
        """, (event_data["name"], event_data["event_date"], event_data.get("on_sale_date"),
              event_data.get("price_min"), event_data.get("price_max"),
              event_data.get("ticket_url"), event_data.get("image_url"),
              venue_id, event_data.get("status", "active"), tm_id))
        event = query_one("SELECT * FROM events WHERE ticketmaster_id = %s", (tm_id,))
    else:
        execute("""
            INSERT INTO events (ticketmaster_id, name, event_date, on_sale_date,
                price_min, price_max, ticket_url, image_url, venue_id, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (tm_id, event_data["name"], event_data["event_date"],
              event_data.get("on_sale_date"), event_data.get("price_min"),
              event_data.get("price_max"), event_data.get("ticket_url"),
              event_data.get("image_url"), venue_id, event_data.get("status", "active")))
        event = query_one("SELECT * FROM events WHERE ticketmaster_id = %s", (tm_id,))

    # Link artists
    if event and event_data.get("artists"):
        _link_event_artists(event["id"], event_data["artists"])

    return event


def _link_event_artists(event_id: int, artists: list):
    for artist_data in artists:
        name_norm = normalize_artist_name(artist_data["name"])
        match_quality = "exact_name"

        # Try exact normalized match
        artist = query_one(
            "SELECT id FROM artists WHERE name_normalized = %s",
            (name_norm,)
        )

        # Fuzzy fallback
        if not artist:
            artist = query_one("""
                SELECT id FROM artists
                WHERE similarity(name_normalized, %s) > %s
                ORDER BY similarity(name_normalized, %s) DESC
                LIMIT 1
            """, (name_norm, SIMILARITY_THRESHOLD, name_norm))
            if artist:
                match_quality = "fuzzy"

        # Create orphan artist if no match
        if not artist:
            execute("""
                INSERT INTO artists (spotify_id, name, name_normalized)
                VALUES (%s, %s, %s)
                ON CONFLICT (spotify_id) DO NOTHING
            """, (f"tm_{artist_data.get('ticketmaster_id', name_norm)}", artist_data["name"], name_norm))
            artist = query_one("SELECT id FROM artists WHERE name_normalized = %s", (name_norm,))
            match_quality = "exact_name"  # orphan is an exact match to itself

        if artist:
            execute("""
                INSERT INTO event_artists (event_id, artist_id, is_headliner, match_quality)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (event_id, artist_id) DO UPDATE SET match_quality = EXCLUDED.match_quality
            """, (event_id, artist["id"], artist_data.get("is_headliner", False), match_quality))


def get_events(search: str = None, sort_by: str = None, sort_dir: str = None,
               page: int = DEFAULT_PAGE, per_page: int = DEFAULT_PER_PAGE) -> dict:
    sort_by = sort_by if sort_by in EVENT_SORT_FIELDS else DEFAULT_EVENT_SORT
    sort_dir = sort_dir if sort_dir in EVENT_SORT_DIRS else DEFAULT_SORT_DIR

    conditions = ["e.status = 'active'", "e.event_date > NOW()"]
    params = []

    if search:
        conditions.append("e.name ILIKE %s")
        params.append(f"%{search}%")

    where = " AND ".join(conditions)
    count_row = query_one(f"SELECT COUNT(*) as total FROM events e WHERE {where}", params)
    total = count_row["total"]

    offset = (page - 1) * per_page
    params.extend([per_page, offset])

    items = query(f"""
        SELECT e.*, v.name as venue_name, v.city as venue_city, v.state as venue_state
        FROM events e
        LEFT JOIN venues v ON v.id = e.venue_id
        WHERE {where}
        ORDER BY {sort_by} {sort_dir}
        LIMIT %s OFFSET %s
    """, params)

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": math.ceil(total / per_page) if per_page else 0,
    }


def get_event_by_id(event_id: int) -> dict | None:
    event = query_one("""
        SELECT e.*, v.name as venue_name, v.city as venue_city,
            v.state as venue_state, v.country as venue_country,
            v.latitude as venue_lat, v.longitude as venue_lng, v.address as venue_address
        FROM events e
        LEFT JOIN venues v ON v.id = e.venue_id
        WHERE e.id = %s
    """, (event_id,))

    if event:
        event["artists"] = query("""
            SELECT a.id, a.spotify_id, a.name, a.image_url, a.popularity, ea.is_headliner
            FROM artists a
            JOIN event_artists ea ON ea.artist_id = a.id
            WHERE ea.event_id = %s
        """, (event_id,))

    return event


def cleanup_old_events():
    execute("DELETE FROM events WHERE event_date < NOW() - INTERVAL '7 days'")


def cleanup_old_job_runs():
    execute("DELETE FROM job_runs WHERE completed_at < NOW() - INTERVAL '30 days'")
