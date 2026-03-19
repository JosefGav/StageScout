import os
import time
import logging
import httpx
from app.constants import LASTFM_BASE_URL, TAG_VECTOR_DIM

logger = logging.getLogger(__name__)

API_KEY = os.environ.get("LASTFM_API_KEY", "")

# 50 canonical genre/style/mood tags — index = vector dimension
CANONICAL_TAGS = [
    "rock", "indie", "electronic", "hip-hop", "pop", "metal", "jazz",
    "classical", "folk", "country", "r&b", "soul", "punk", "alternative",
    "blues", "ambient", "dance", "house", "techno", "rap",
    "singer-songwriter", "experimental", "post-rock", "shoegaze", "grunge",
    "emo", "hardcore", "psychedelic", "progressive", "funk",
    "reggae", "latin", "world", "acoustic", "lo-fi",
    "new wave", "synth-pop", "dream pop", "garage rock", "indie pop",
    "indie rock", "post-punk", "trip-hop", "downtempo", "drum and bass",
    "dubstep", "disco", "k-pop", "ska", "gospel",
]

# Map common variations to canonical tag names
TAG_ALIASES = {
    "hip hop": "hip-hop",
    "hiphop": "hip-hop",
    "hip hop/rap": "hip-hop",
    "rnb": "r&b",
    "rhythm and blues": "r&b",
    "electronica": "electronic",
    "electro": "electronic",
    "edm": "electronic",
    "heavy metal": "metal",
    "death metal": "metal",
    "black metal": "metal",
    "thrash metal": "metal",
    "nu metal": "metal",
    "metalcore": "hardcore",
    "post-hardcore": "hardcore",
    "classic rock": "rock",
    "hard rock": "rock",
    "soft rock": "rock",
    "alt-rock": "alternative",
    "alt rock": "alternative",
    "alternative rock": "alternative",
    "neo-soul": "soul",
    "neo soul": "soul",
    "deep house": "house",
    "progressive house": "house",
    "tech house": "house",
    "minimal techno": "techno",
    "detroit techno": "techno",
    "acid house": "house",
    "folktronica": "folk",
    "neofolk": "folk",
    "americana": "country",
    "bluegrass": "country",
    "contemporary classical": "classical",
    "post-classical": "classical",
    "chillwave": "ambient",
    "chillout": "ambient",
    "lofi": "lo-fi",
    "lo fi": "lo-fi",
    "dnb": "drum and bass",
    "d&b": "drum and bass",
    "jungle": "drum and bass",
    "progressive rock": "progressive",
    "prog rock": "progressive",
    "prog": "progressive",
    "psych": "psychedelic",
    "psych rock": "psychedelic",
    "post rock": "post-rock",
    "postrock": "post-rock",
    "postpunk": "post-punk",
    "post punk": "post-punk",
    "dreampop": "dream pop",
    "synthpop": "synth-pop",
    "synth pop": "synth-pop",
    "triphop": "trip-hop",
    "trip hop": "trip-hop",
    "kpop": "k-pop",
    "korean pop": "k-pop",
    "reggaeton": "latin",
    "salsa": "latin",
    "bossa nova": "latin",
    "samba": "latin",
}

_TAG_INDEX = {tag: i for i, tag in enumerate(CANONICAL_TAGS)}


def _resolve_tag(name: str) -> str | None:
    """Resolve a raw Last.fm tag name to a canonical tag, or None if unmapped."""
    lower = name.lower().strip()
    if lower in _TAG_INDEX:
        return lower
    alias = TAG_ALIASES.get(lower)
    if alias and alias in _TAG_INDEX:
        return alias
    return None


def lastfm_get(method: str, params: dict | None = None) -> dict:
    """Call the Last.fm API with rate limiting and retry."""
    req_params = {
        "method": method,
        "api_key": API_KEY,
        "format": "json",
    }
    if params:
        req_params.update(params)

    for attempt in range(3):
        try:
            resp = httpx.get(LASTFM_BASE_URL, params=req_params, timeout=15)
            if resp.status_code == 429:
                time.sleep(2 ** attempt)
                continue
            if resp.status_code >= 500:
                time.sleep(1)
                continue
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError:
            if attempt == 2:
                raise
            time.sleep(1)
    return {}


def fetch_similar_artists(artist_name: str, limit: int = 20) -> list[dict]:
    """Fetch similar artists from Last.fm. Returns [{name, match}]."""
    time.sleep(0.2)
    try:
        data = lastfm_get("artist.getSimilar", {
            "artist": artist_name,
            "limit": str(limit),
        })
        artists = data.get("similarartists", {}).get("artist", [])
        if isinstance(artists, dict):
            artists = [artists]
        return [
            {"name": a["name"], "match": float(a.get("match", 0))}
            for a in artists if a.get("name")
        ]
    except Exception as e:
        logger.warning(f"Last.fm getSimilar failed for '{artist_name}': {e}")
        return []


def fetch_artist_tags(artist_name: str) -> list[dict]:
    """Fetch top tags for an artist from Last.fm. Returns [{name, count}]."""
    time.sleep(0.2)
    try:
        data = lastfm_get("artist.getTopTags", {"artist": artist_name})
        tags = data.get("toptags", {}).get("tag", [])
        if isinstance(tags, dict):
            tags = [tags]
        return [
            {"name": t["name"], "count": int(t.get("count", 0))}
            for t in tags if t.get("name")
        ]
    except Exception as e:
        logger.warning(f"Last.fm getTopTags failed for '{artist_name}': {e}")
        return []


def tags_to_vector(tags: list[dict]) -> list[float] | None:
    """Convert Last.fm tags to a TAG_VECTOR_DIM-dimensional vector. Returns None if no tags map."""
    vector = [0.0] * TAG_VECTOR_DIM
    mapped = False

    for tag in tags:
        canonical = _resolve_tag(tag["name"])
        if canonical is None:
            continue
        idx = _TAG_INDEX[canonical]
        weight = tag["count"] / 100.0
        vector[idx] = max(vector[idx], weight)  # take highest weight if multiple aliases map to same tag
        mapped = True

    return vector if mapped else None


def compute_artist_tag_vector(artist_name: str) -> list[float] | None:
    """Fetch tags from Last.fm and convert to vector."""
    tags = fetch_artist_tags(artist_name)
    if not tags:
        return None
    return tags_to_vector(tags)
