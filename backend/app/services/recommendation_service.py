import logging
from app.db import query, query_one, execute
from app.constants import AUDIO_FEATURE_KEYS, TOP_RECOMMENDED_ARTISTS

logger = logging.getLogger(__name__)


def compute_taste_centroid(user_id: int):
    """Compute weighted average of user's artists' audio feature vectors."""
    rows = query("""
        SELECT a.audio_features, ua.play_weight
        FROM artists a
        JOIN user_artists ua ON ua.artist_id = a.id
        WHERE ua.user_id = %s AND a.audio_features IS NOT NULL
    """, (user_id,))

    if not rows:
        return

    dim = len(AUDIO_FEATURE_KEYS)
    weighted_sum = [0.0] * dim
    total_weight = 0.0

    for row in rows:
        features = row["audio_features"]
        weight = float(row["play_weight"])

        # pgvector returns as string like "[0.1,0.2,...]" or as a list
        if isinstance(features, str):
            features = [float(x) for x in features.strip("[]").split(",")]

        for i in range(min(dim, len(features))):
            weighted_sum[i] += features[i] * weight
        total_weight += weight

    if total_weight == 0:
        return

    centroid = [v / total_weight for v in weighted_sum]
    vector_str = "[" + ",".join(str(v) for v in centroid) + "]"

    execute("UPDATE users SET taste_centroid = %s WHERE id = %s", (vector_str, user_id))


def compute_recommendations(user_id: int):
    """Rank related artist candidates by cosine similarity to user's taste centroid."""
    user = query_one("SELECT taste_centroid FROM users WHERE id = %s", (user_id,))
    if not user or not user["taste_centroid"]:
        return

    # Get candidate related artists (excluding user's own artists)
    candidates = query("""
        SELECT DISTINCT a.id, a.audio_features
        FROM related_artists ra
        JOIN artists a ON a.id = ra.related_artist_id
        WHERE ra.artist_id IN (SELECT artist_id FROM user_artists WHERE user_id = %s)
            AND a.id NOT IN (SELECT artist_id FROM user_artists WHERE user_id = %s)
            AND a.audio_features IS NOT NULL
    """, (user_id, user_id))

    if not candidates:
        return

    # Rank by cosine distance using pgvector
    # Clear old recommendations
    execute("DELETE FROM user_recommended_artists WHERE user_id = %s", (user_id,))

    # Use pgvector's <=> operator for cosine distance ranking
    ranked = query("""
        SELECT DISTINCT a.id, 1 - (a.audio_features <=> u.taste_centroid) as similarity
        FROM artists a
        CROSS JOIN (SELECT taste_centroid FROM users WHERE id = %s) u
        WHERE a.id IN (
            SELECT DISTINCT ra.related_artist_id
            FROM related_artists ra
            WHERE ra.artist_id IN (SELECT artist_id FROM user_artists WHERE user_id = %s)
        )
        AND a.id NOT IN (SELECT artist_id FROM user_artists WHERE user_id = %s)
        AND a.audio_features IS NOT NULL
        AND u.taste_centroid IS NOT NULL
        ORDER BY similarity DESC
        LIMIT %s
    """, (user_id, user_id, user_id, TOP_RECOMMENDED_ARTISTS))

    for row in ranked:
        execute("""
            INSERT INTO user_recommended_artists (user_id, artist_id, similarity_score)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id, artist_id) DO UPDATE SET similarity_score = EXCLUDED.similarity_score, ranked_at = NOW()
        """, (user_id, row["id"], row["similarity"]))


def get_similar_artists(artist_id: int, limit: int = 20) -> list:
    return query("""
        SELECT a.id, a.spotify_id, a.name, a.image_url, a.popularity
        FROM related_artists ra
        JOIN artists a ON a.id = ra.related_artist_id
        WHERE ra.artist_id = %s
        LIMIT %s
    """, (artist_id, limit))


def get_user_recommended_artists(user_id: int) -> list:
    return query("""
        SELECT a.id, a.spotify_id, a.name, a.image_url, a.popularity,
            ura.similarity_score
        FROM user_recommended_artists ura
        JOIN artists a ON a.id = ura.artist_id
        WHERE ura.user_id = %s
        ORDER BY ura.similarity_score DESC
    """, (user_id,))
