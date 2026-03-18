from app.db import query, execute


def compute_matches_for_user(user_id: int) -> int:
    """Compute exact + similar event matches for a user. Returns count of new matches."""
    count = 0

    # Exact matches: user's artists that have upcoming events
    exact = query("""
        SELECT DISTINCT ea.event_id, ua.artist_id as matched_artist_id, ea.artist_id as event_artist_id
        FROM user_artists ua
        JOIN event_artists ea ON ea.artist_id = ua.artist_id
        JOIN events e ON e.id = ea.event_id
        WHERE ua.user_id = %s
            AND e.status = 'active'
            AND e.event_date > NOW()
            AND NOT EXISTS (
                SELECT 1 FROM user_event_matches m
                WHERE m.user_id = %s AND m.event_id = ea.event_id
                    AND m.matched_artist_id = ua.artist_id
                    AND m.event_artist_id = ea.artist_id
            )
    """, (user_id, user_id))

    for match in exact:
        execute("""
            INSERT INTO user_event_matches (user_id, event_id, match_type, matched_artist_id, event_artist_id)
            VALUES (%s, %s, 'exact', %s, %s)
            ON CONFLICT DO NOTHING
        """, (user_id, match["event_id"], match["matched_artist_id"], match["event_artist_id"]))
        count += 1

    # Similar matches: recommended artists with upcoming events
    similar = query("""
        SELECT DISTINCT ea.event_id, ura.artist_id as matched_artist_id,
            ea.artist_id as event_artist_id, ura.similarity_score
        FROM user_recommended_artists ura
        JOIN event_artists ea ON ea.artist_id = ura.artist_id
        JOIN events e ON e.id = ea.event_id
        WHERE ura.user_id = %s
            AND e.status = 'active'
            AND e.event_date > NOW()
            AND NOT EXISTS (
                SELECT 1 FROM user_event_matches m
                WHERE m.user_id = %s AND m.event_id = ea.event_id
                    AND m.matched_artist_id = ura.artist_id
                    AND m.event_artist_id = ea.artist_id
            )
    """, (user_id, user_id))

    for match in similar:
        execute("""
            INSERT INTO user_event_matches
                (user_id, event_id, match_type, matched_artist_id, event_artist_id, similarity_score)
            VALUES (%s, %s, 'similar', %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (user_id, match["event_id"], match["matched_artist_id"],
              match["event_artist_id"], match["similarity_score"]))
        count += 1

    return count


def get_matched_events(user_id: int, match_type: str = None) -> list:
    conditions = ["m.user_id = %s", "e.status = 'active'", "e.event_date > NOW()"]
    params = [user_id]

    if match_type in ("exact", "similar"):
        conditions.append("m.match_type = %s")
        params.append(match_type)

    # Filter by user's location radius using Haversine.
    # Events with missing venue/user coordinates are still included (pass through).
    conditions.append("""
        (
            v.latitude IS NULL OR v.longitude IS NULL
            OR u.latitude IS NULL OR u.longitude IS NULL
            OR (
                3959 * acos(
                    LEAST(1.0, cos(radians(u.latitude)) * cos(radians(v.latitude))
                    * cos(radians(v.longitude) - radians(u.longitude))
                    + sin(radians(u.latitude)) * sin(radians(v.latitude)))
                )
            ) <= u.search_radius_miles
        )
    """)

    where = " AND ".join(conditions)

    # Group by event to deduplicate multi-artist matches.
    # Collect matched artists into a JSON array; pick best match_type and quality per event.
    return query(f"""
        SELECT
            e.id as event_id, e.name as event_name, e.event_date, e.image_url,
            e.price_min, e.price_max, e.ticket_url, e.status,
            v.name as venue_name, v.city as venue_city, v.state as venue_state,
            MIN(m.match_type) as match_type,
            MIN(ea.match_quality) as match_quality,
            MAX(m.similarity_score) as similarity_score,
            json_agg(json_build_object(
                'id', a.id, 'name', a.name, 'image_url', a.image_url,
                'tracks', (
                    SELECT json_agg(ut.track_name ORDER BY ut.track_name)
                    FROM user_tracks ut
                    WHERE ut.user_id = m.user_id AND ut.artist_id = a.id
                )
            ) ORDER BY a.name) FILTER (WHERE a.id IS NOT NULL) as matched_artists
        FROM user_event_matches m
        JOIN events e ON e.id = m.event_id
        JOIN users u ON u.id = m.user_id
        LEFT JOIN venues v ON v.id = e.venue_id
        LEFT JOIN artists a ON a.id = m.matched_artist_id
        LEFT JOIN event_artists ea ON ea.event_id = e.id AND ea.artist_id = m.event_artist_id
        WHERE {where}
        GROUP BY e.id, e.name, e.event_date, e.image_url,
            e.price_min, e.price_max, e.ticket_url, e.status,
            v.name, v.city, v.state
        ORDER BY MIN(ea.match_quality) ASC, MIN(m.match_type) ASC, e.event_date ASC
    """, params)


def get_recommended_events(user_id: int) -> list:
    return get_matched_events(user_id, match_type="similar")


def cleanup_stale_matches():
    """Remove matches for events that are no longer active or have passed."""
    execute("""
        DELETE FROM user_event_matches m
        USING events e
        WHERE m.event_id = e.id
            AND (e.status != 'active' OR e.event_date < NOW())
    """)
