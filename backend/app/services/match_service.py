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

    where = " AND ".join(conditions)

    return query(f"""
        SELECT m.id, m.match_type, m.similarity_score,
            e.id as event_id, e.name as event_name, e.event_date, e.image_url,
            e.price_min, e.price_max, e.ticket_url, e.status,
            v.name as venue_name, v.city as venue_city, v.state as venue_state,
            a.id as artist_id, a.name as artist_name, a.image_url as artist_image,
            ea.match_quality
        FROM user_event_matches m
        JOIN events e ON e.id = m.event_id
        LEFT JOIN venues v ON v.id = e.venue_id
        LEFT JOIN artists a ON a.id = m.matched_artist_id
        LEFT JOIN event_artists ea ON ea.event_id = e.id AND ea.artist_id = m.event_artist_id
        WHERE {where}
        ORDER BY ea.match_quality ASC, m.match_type ASC, e.event_date ASC
    """, params)


def get_recommended_events(user_id: int) -> list:
    return get_matched_events(user_id, match_type="similar")
