from app.db import query_one, execute


def upsert_from_spotify(spotify_id: str, email: str, display_name: str,
                        avatar_url: str | None,
                        access_token: str, refresh_token: str,
                        token_expires_at) -> dict:
    existing = query_one(
        "SELECT * FROM users WHERE spotify_id = %s", (spotify_id,)
    )
    if existing:
        execute("""
            UPDATE users
            SET email = %s, display_name = %s, avatar_url = %s,
                spotify_access_token = %s, spotify_refresh_token = %s,
                spotify_token_expires_at = %s
            WHERE spotify_id = %s
        """, (email, display_name, avatar_url, access_token, refresh_token,
              token_expires_at, spotify_id))
        return query_one("SELECT * FROM users WHERE spotify_id = %s", (spotify_id,))
    else:
        execute("""
            INSERT INTO users (spotify_id, email, display_name, avatar_url,
                               spotify_access_token, spotify_refresh_token,
                               spotify_token_expires_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (spotify_id, email, display_name, avatar_url,
              access_token, refresh_token, token_expires_at))
        return query_one("SELECT * FROM users WHERE spotify_id = %s", (spotify_id,))


def get_user_by_id(user_id: int) -> dict | None:
    return query_one("SELECT * FROM users WHERE id = %s", (user_id,))


def update_user(user_id: int, city: str | None = None,
                latitude=None, longitude=None,
                search_radius_miles: int | None = None) -> dict:
    fields = []
    params = []
    if city is not None:
        fields.append("city = %s")
        params.append(city)
    if latitude is not None:
        fields.append("latitude = %s")
        params.append(latitude)
    if longitude is not None:
        fields.append("longitude = %s")
        params.append(longitude)
    if search_radius_miles is not None:
        fields.append("search_radius_miles = %s")
        params.append(search_radius_miles)

    if not fields:
        return get_user_by_id(user_id)

    params.append(user_id)
    execute(f"UPDATE users SET {', '.join(fields)} WHERE id = %s", params)
    return get_user_by_id(user_id)


def update_notification_prefs(user_id: int, digest_enabled: bool | None = None,
                              digest_frequency: str | None = None) -> dict:
    fields = []
    params = []
    if digest_enabled is not None:
        fields.append("digest_enabled = %s")
        params.append(digest_enabled)
    if digest_frequency is not None:
        fields.append("digest_frequency = %s")
        params.append(digest_frequency)

    if not fields:
        return get_user_by_id(user_id)

    params.append(user_id)
    execute(f"UPDATE users SET {', '.join(fields)} WHERE id = %s", params)
    return get_user_by_id(user_id)


def update_sync_status(user_id: int, status: str, artists_found: int | None = None):
    if artists_found is not None:
        execute(
            "UPDATE users SET sync_status = %s, artists_found = %s WHERE id = %s",
            (status, artists_found, user_id)
        )
    else:
        execute(
            "UPDATE users SET sync_status = %s WHERE id = %s",
            (status, user_id)
        )


def set_last_sync(user_id: int):
    execute("UPDATE users SET last_spotify_sync = NOW() WHERE id = %s", (user_id,))


def delete_user(user_id: int):
    execute("DELETE FROM users WHERE id = %s", (user_id,))
