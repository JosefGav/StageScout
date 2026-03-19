import re

# Pagination
DEFAULT_PAGE = 1
DEFAULT_PER_PAGE = 20
MAX_PER_PAGE = 100

# Event sort whitelists
EVENT_SORT_FIELDS = {"event_date", "name", "price_min", "created_at"}
EVENT_SORT_DIRS = {"asc", "desc"}
DEFAULT_EVENT_SORT = "event_date"
DEFAULT_SORT_DIR = "asc"

# Artist sort whitelists
ARTIST_SORT_FIELDS = {"name", "popularity", "created_at"}

# Matched event sort whitelists
MATCHED_EVENT_SORT_FIELDS = {"date", "distance", "play_weight"}

# Tag vector config (Last.fm tags → VECTOR(50))
TAG_VECTOR_DIM = 50

# Recommendation
TOP_RECOMMENDED_ARTISTS = 50
SIMILARITY_THRESHOLD = 0.9  # pg_trgm threshold for fuzzy artist matching

# Spotify
SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_API_BASE = "https://api.spotify.com/v1"
SPOTIFY_SCOPES = "user-library-read playlist-read-private user-top-read user-read-email"

# Last.fm
LASTFM_BASE_URL = "https://ws.audioscrobbler.com/2.0/"

# Ticketmaster
TICKETMASTER_BASE_URL = "https://app.ticketmaster.com/discovery/v2"
TICKETMASTER_DAILY_LIMIT = 4500
TICKETMASTER_REQ_PER_SEC = 4

# Sync stages
SYNC_STAGES = ("idle", "syncing_stage1", "syncing_stage2", "syncing_stage3")


def normalize_artist_name(name: str) -> str:
    name = name.lower().strip()
    name = re.sub(r'^(the|a)\s+', '', name)
    name = re.sub(r',\s*(the|a)$', '', name)
    name = re.sub(r'[^\w\s]', '', name)
    name = re.sub(r'\s+', ' ', name).strip()
    return name
