import os
import base64
import time
from datetime import datetime, timezone, timedelta
import httpx
from app.db import query_one, execute
from app.constants import SPOTIFY_TOKEN_URL, SPOTIFY_API_BASE

CLIENT_ID = os.environ.get("SPOTIFY_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("SPOTIFY_CLIENT_SECRET", "")
REDIRECT_URI = os.environ.get("SPOTIFY_REDIRECT_URI", "")


def _basic_auth() -> str:
    creds = f"{CLIENT_ID}:{CLIENT_SECRET}"
    return base64.b64encode(creds.encode()).decode()


def exchange_code(code: str) -> dict:
    resp = httpx.post(SPOTIFY_TOKEN_URL, data={
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
    }, headers={"Authorization": f"Basic {_basic_auth()}"}, timeout=10)
    resp.raise_for_status()
    return resp.json()


def refresh_access_token(refresh_token: str) -> dict:
    resp = httpx.post(SPOTIFY_TOKEN_URL, data={
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
    }, headers={"Authorization": f"Basic {_basic_auth()}"}, timeout=10)
    resp.raise_for_status()
    return resp.json()


def get_valid_token(user_id: int) -> str:
    user = query_one("SELECT spotify_access_token, spotify_refresh_token, spotify_token_expires_at FROM users WHERE id = %s", (user_id,))
    if not user or not user["spotify_access_token"]:
        raise Exception("No Spotify tokens for user")

    expires_at = user["spotify_token_expires_at"]
    if expires_at and expires_at.replace(tzinfo=timezone.utc) > datetime.now(timezone.utc):
        return user["spotify_access_token"]

    # Refresh
    data = refresh_access_token(user["spotify_refresh_token"])
    new_expires = datetime.now(timezone.utc) + timedelta(seconds=data["expires_in"])
    execute("""
        UPDATE users SET spotify_access_token = %s, spotify_token_expires_at = %s
        WHERE id = %s
    """, (data["access_token"], new_expires, user_id))
    return data["access_token"]


def spotify_get(token: str, url: str, params: dict = None, retries: int = 3) -> dict:
    for attempt in range(retries):
        resp = httpx.get(url, headers={"Authorization": f"Bearer {token}"}, params=params, timeout=15)
        if resp.status_code == 429:
            retry_after = int(resp.headers.get("Retry-After", "2"))
            time.sleep(retry_after)
            continue
        resp.raise_for_status()
        return resp.json()
    raise Exception(f"Spotify rate limited after {retries} retries")


def fetch_profile(token: str) -> dict:
    return spotify_get(token, f"{SPOTIFY_API_BASE}/me")


def fetch_top_artists(token: str, limit: int = 50) -> list:
    data = spotify_get(token, f"{SPOTIFY_API_BASE}/me/top/artists", {"limit": limit, "time_range": "medium_term"})
    return data.get("items", [])


def fetch_liked_songs(token: str) -> list:
    """Paginate through all liked songs, extract artists and their tracks."""
    artists = {}
    url = f"{SPOTIFY_API_BASE}/me/tracks"
    params = {"limit": 50}

    while url:
        data = spotify_get(token, url, params)
        for item in data.get("items", []):
            track = item.get("track", {})
            track_id = track.get("id")
            track_name = track.get("name")
            for artist in track.get("artists", []):
                aid = artist.get("id")
                if aid:
                    if aid not in artists:
                        artists[aid] = {"spotify_data": artist, "count": 0, "tracks": []}
                    artists[aid]["count"] += 1
                    if track_id and track_name:
                        artists[aid]["tracks"].append({"id": track_id, "name": track_name})
        url = data.get("next")
        params = None  # next URL has params built in
        time.sleep(0.1)

    return list(artists.values())


def fetch_playlist_tracks(token: str) -> list:
    """Fetch artists and their tracks from user's playlists."""
    artists = {}

    # Get playlists
    playlists_data = spotify_get(token, f"{SPOTIFY_API_BASE}/me/playlists", {"limit": 50})
    playlists = playlists_data.get("items", [])

    for playlist in playlists:
        if not playlist or not playlist.get("tracks"):
            continue
        tracks_url = playlist["tracks"].get("href")
        if not tracks_url:
            continue

        try:
            tracks_data = spotify_get(token, tracks_url, {"limit": 100})
            for item in tracks_data.get("items", []):
                track = item.get("track")
                if not track:
                    continue
                track_id = track.get("id")
                track_name = track.get("name")
                for artist in track.get("artists", []):
                    aid = artist.get("id")
                    if aid:
                        if aid not in artists:
                            artists[aid] = {"spotify_data": artist, "count": 0, "tracks": []}
                        artists[aid]["count"] += 1
                        if track_id and track_name:
                            artists[aid]["tracks"].append({"id": track_id, "name": track_name})
            time.sleep(0.1)
        except Exception:
            continue  # skip inaccessible playlists

    return list(artists.values())


def fetch_artist_details(token: str, spotify_id: str) -> dict:
    return spotify_get(token, f"{SPOTIFY_API_BASE}/artists/{spotify_id}")


def fetch_several_artists(token: str, spotify_ids: list[str]) -> list:
    """Batch-fetch up to 50 artists at a time. Returns full artist objects with genres + popularity."""
    all_artists = []
    for i in range(0, len(spotify_ids), 50):
        batch = spotify_ids[i:i + 50]
        ids_str = ",".join(batch)
        data = spotify_get(token, f"{SPOTIFY_API_BASE}/artists", {"ids": ids_str})
        all_artists.extend([a for a in data.get("artists", []) if a is not None])
        time.sleep(0.1)
    return all_artists
