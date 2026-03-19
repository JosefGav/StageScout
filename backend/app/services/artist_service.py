import logging
from app.db import query, query_one, execute
from app.constants import normalize_artist_name
from app.services import spotify_service, lastfm_service
from app.services.user_service import update_sync_status, set_last_sync

logger = logging.getLogger(__name__)


def upsert_artist(spotify_id: str, name: str, image_url: str | None = None,
                  popularity: int | None = None, genres: list[str] | None = None) -> dict:
    name_norm = normalize_artist_name(name)
    existing = query_one("SELECT * FROM artists WHERE spotify_id = %s", (spotify_id,))

    if existing:
        execute("""
            UPDATE artists SET image_url = COALESCE(%s, image_url),
                               popularity = COALESCE(%s, popularity)
            WHERE spotify_id = %s
        """, (image_url, popularity, spotify_id))
        artist = query_one("SELECT * FROM artists WHERE spotify_id = %s", (spotify_id,))
    else:
        execute("""
            INSERT INTO artists (spotify_id, name, name_normalized, image_url, popularity)
            VALUES (%s, %s, %s, %s, %s)
        """, (spotify_id, name, name_norm, image_url, popularity))
        artist = query_one("SELECT * FROM artists WHERE spotify_id = %s", (spotify_id,))

    if genres:
        _upsert_artist_genres(artist["id"], genres)

    return artist


def _upsert_artist_genres(artist_id: int, genre_names: list[str]):
    for genre_name in genre_names:
        genre = query_one("SELECT id FROM genres WHERE name = %s", (genre_name,))
        if not genre:
            execute("INSERT INTO genres (name) VALUES (%s) ON CONFLICT (name) DO NOTHING", (genre_name,))
            genre = query_one("SELECT id FROM genres WHERE name = %s", (genre_name,))
        if genre:
            execute("""
                INSERT INTO artist_genres (artist_id, genre_id)
                VALUES (%s, %s)
                ON CONFLICT DO NOTHING
            """, (artist_id, genre["id"]))


def upsert_user_artist(user_id: int, artist_id: int, source: str = "liked_songs",
                       play_weight: float = 1.0):
    execute("""
        INSERT INTO user_artists (user_id, artist_id, source, play_weight)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (user_id, artist_id) DO UPDATE
        SET play_weight = GREATEST(user_artists.play_weight, EXCLUDED.play_weight),
            synced_at = NOW()
    """, (user_id, artist_id, source, play_weight))


def upsert_user_tracks(user_id: int, artist_id: int, tracks: list, source: str = "liked_songs"):
    """Store a user's saved tracks for a given artist."""
    for t in tracks:
        execute("""
            INSERT INTO user_tracks (user_id, artist_id, spotify_track_id, track_name, source)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (user_id, artist_id, spotify_track_id) DO NOTHING
        """, (user_id, artist_id, t["id"], t["name"], source))


def get_user_artists(user_id: int) -> list:
    return query("""
        SELECT a.*, ua.source, ua.play_weight,
            (SELECT COUNT(*) FROM event_artists ea
             JOIN events e ON e.id = ea.event_id
             WHERE ea.artist_id = a.id AND e.status = 'active'
             AND e.event_date > NOW()) AS event_count
        FROM artists a
        JOIN user_artists ua ON ua.artist_id = a.id
        WHERE ua.user_id = %s
        ORDER BY ua.play_weight DESC
    """, (user_id,))


def get_artist_by_id(artist_id: int) -> dict | None:
    return query_one("SELECT * FROM artists WHERE id = %s", (artist_id,))


def compute_tag_vectors(artist_ids: list[int]):
    """Fetch Last.fm tags and compute tag vectors for artists that don't have them yet."""
    if not artist_ids:
        return

    artists_needing_vectors = query("""
        SELECT id, name FROM artists
        WHERE id = ANY(%s) AND audio_features IS NULL
    """, (artist_ids,))

    for artist in artists_needing_vectors:
        try:
            vector = lastfm_service.compute_artist_tag_vector(artist["name"])
            if not vector:
                continue

            vector_str = "[" + ",".join(str(v) for v in vector) + "]"
            execute(
                "UPDATE artists SET audio_features = %s WHERE id = %s",
                (vector_str, artist["id"])
            )
        except Exception as e:
            logger.warning(f"Failed to compute tag vector for artist '{artist['name']}': {e}")
            continue


def run_full_sync(user_id: int):
    """Full staged sync: top artists → liked songs → playlists → related → features."""
    try:
        # Stage 1: Top artists
        update_sync_status(user_id, "syncing_stage1", 0)
        token = spotify_service.get_valid_token(user_id)

        top_artists = spotify_service.fetch_top_artists(token)
        artist_ids = []
        for sp_artist in top_artists:
            images = sp_artist.get("images", [])
            image_url = images[0]["url"] if images else None
            artist = upsert_artist(
                spotify_id=sp_artist["id"],
                name=sp_artist["name"],
                image_url=image_url,
                popularity=sp_artist.get("popularity"),
                genres=sp_artist.get("genres", []),
            )
            upsert_user_artist(user_id, artist["id"], source="top_artists", play_weight=5.0)
            artist_ids.append(artist["id"])

        update_sync_status(user_id, "syncing_stage1", len(artist_ids))

        # Stage 2: Liked songs + playlists
        update_sync_status(user_id, "syncing_stage2", len(artist_ids))

        liked_data = spotify_service.fetch_liked_songs(token)
        for item in liked_data:
            sp = item["spotify_data"]
            artist = upsert_artist(spotify_id=sp["id"], name=sp["name"])
            weight = min(item["count"] * 0.5, 10.0)
            upsert_user_artist(user_id, artist["id"], source="liked_songs", play_weight=weight)
            if item.get("tracks"):
                upsert_user_tracks(user_id, artist["id"], item["tracks"], source="liked_songs")
            artist_ids.append(artist["id"])

        playlist_data = spotify_service.fetch_playlist_tracks(token)
        for item in playlist_data:
            sp = item["spotify_data"]
            artist = upsert_artist(spotify_id=sp["id"], name=sp["name"])
            weight = min(item["count"] * 0.3, 5.0)
            upsert_user_artist(user_id, artist["id"], source="playlist", play_weight=weight)
            if item.get("tracks"):
                upsert_user_tracks(user_id, artist["id"], item["tracks"], source="playlist")
            artist_ids.append(artist["id"])

        unique_ids = list(set(artist_ids))
        update_sync_status(user_id, "syncing_stage2", len(unique_ids))

        # Backfill missing artist images for artists discovered via liked songs / playlists
        _backfill_artist_images(user_id, unique_ids)

        # Stage 3: Related artists + audio features + centroid
        update_sync_status(user_id, "syncing_stage3", len(unique_ids))

        _fetch_related_artists_for_user(unique_ids)
        compute_tag_vectors(unique_ids)

        # Compute taste centroid
        from app.services.recommendation_service import compute_taste_centroid, compute_recommendations
        compute_taste_centroid(user_id)
        compute_recommendations(user_id)

        set_last_sync(user_id)
        update_sync_status(user_id, "idle", len(unique_ids))

    except Exception as e:
        logger.error(f"Sync failed for user {user_id}: {e}")
        update_sync_status(user_id, "idle")


def _upsert_artist_by_name(name: str) -> dict | None:
    """Look up an artist by normalized name, or create a placeholder if not found."""
    name_norm = normalize_artist_name(name)
    existing = query_one(
        "SELECT * FROM artists WHERE name_normalized = %s LIMIT 1",
        (name_norm,)
    )
    if existing:
        return existing

    placeholder_id = f"lastfm:{name_norm}"
    # Check if placeholder already exists
    existing = query_one("SELECT * FROM artists WHERE spotify_id = %s", (placeholder_id,))
    if existing:
        return existing

    execute("""
        INSERT INTO artists (spotify_id, name, name_normalized)
        VALUES (%s, %s, %s)
    """, (placeholder_id, name, name_norm))
    return query_one("SELECT * FROM artists WHERE spotify_id = %s", (placeholder_id,))


def _fetch_related_artists_for_user(artist_ids: list[int]):
    """Fetch similar artists from Last.fm for each user artist, skip if already fetched."""
    new_artist_ids = []

    for artist_id in artist_ids:
        artist = get_artist_by_id(artist_id)
        if not artist:
            continue

        # Skip if related artists already fetched for this artist
        existing = query_one(
            "SELECT 1 FROM related_artists WHERE artist_id = %s LIMIT 1",
            (artist_id,)
        )
        if existing:
            continue

        try:
            similar = lastfm_service.fetch_similar_artists(artist["name"], limit=20)
            for s in similar:
                rel_artist = _upsert_artist_by_name(s["name"])
                if not rel_artist or rel_artist["id"] == artist_id:
                    continue
                new_artist_ids.append(rel_artist["id"])
                execute("""
                    INSERT INTO related_artists (artist_id, related_artist_id)
                    VALUES (%s, %s) ON CONFLICT DO NOTHING
                """, (artist_id, rel_artist["id"]))

        except Exception as e:
            logger.warning(f"Failed to fetch similar artists for '{artist['name']}': {e}")
            continue

    # Compute tag vectors for newly discovered related artists
    if new_artist_ids:
        compute_tag_vectors(list(set(new_artist_ids)))


def _backfill_artist_images(user_id: int, artist_ids: list[int]):
    """Batch-fetch full artist details for artists missing images."""
    if not artist_ids:
        return

    missing = query("""
        SELECT id, spotify_id FROM artists
        WHERE id = ANY(%s) AND image_url IS NULL AND spotify_id IS NOT NULL
    """, (artist_ids,))

    if not missing:
        return

    logger.info(f"Backfilling images for {len(missing)} artists")
    token = spotify_service.get_valid_token(user_id)
    spotify_ids = [a["spotify_id"] for a in missing]

    try:
        full_artists = spotify_service.fetch_several_artists(token, spotify_ids)
        for sp_artist in full_artists:
            images = sp_artist.get("images", [])
            image_url = images[0]["url"] if images else None
            if image_url:
                upsert_artist(
                    spotify_id=sp_artist["id"],
                    name=sp_artist["name"],
                    image_url=image_url,
                    popularity=sp_artist.get("popularity"),
                    genres=sp_artist.get("genres", []),
                )
    except Exception as e:
        logger.warning(f"Failed to backfill artist images: {e}")
