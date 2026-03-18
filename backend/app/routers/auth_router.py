import os
import secrets
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException
from app.schemas import SpotifyCallbackRequest, AuthResponse
from app.auth import create_jwt
from app.services.user_service import upsert_from_spotify
from app.services.spotify_service import exchange_code, fetch_profile
from app.constants import SPOTIFY_AUTH_URL, SPOTIFY_SCOPES

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Simple in-memory state store for CSRF protection
_oauth_states: dict[str, float] = {}
STATE_TTL = 600  # 10 minutes


def _cleanup_states():
    now = datetime.now(timezone.utc).timestamp()
    expired = [k for k, v in _oauth_states.items() if now - v > STATE_TTL]
    for k in expired:
        del _oauth_states[k]


@router.get("/spotify/login")
def spotify_login():
    _cleanup_states()
    state = secrets.token_urlsafe(32)
    _oauth_states[state] = datetime.now(timezone.utc).timestamp()

    client_id = os.environ.get("SPOTIFY_CLIENT_ID", "")
    redirect_uri = os.environ.get("SPOTIFY_REDIRECT_URI", "")

    authorize_url = (
        f"{SPOTIFY_AUTH_URL}?"
        f"client_id={client_id}"
        f"&response_type=code"
        f"&redirect_uri={redirect_uri}"
        f"&scope={SPOTIFY_SCOPES}"
        f"&state={state}"
    )
    return {"url": authorize_url}


@router.post("/spotify/callback")
def spotify_callback(body: SpotifyCallbackRequest):
    # Verify state
    if body.state not in _oauth_states:
        raise HTTPException(status_code=400, detail="Invalid or expired state")
    del _oauth_states[body.state]

    # Exchange code for tokens
    try:
        token_data = exchange_code(body.code)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Token exchange failed: {e}")

    access_token = token_data["access_token"]
    refresh_token = token_data.get("refresh_token", "")
    expires_in = token_data.get("expires_in", 3600)
    token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

    # Fetch Spotify profile
    try:
        profile = fetch_profile(access_token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch profile: {e}")

    spotify_id = profile["id"]
    email = profile.get("email", "")
    display_name = profile.get("display_name", spotify_id)
    images = profile.get("images", [])
    avatar_url = images[0]["url"] if images else None

    # Upsert user
    user = upsert_from_spotify(
        spotify_id=spotify_id,
        email=email,
        display_name=display_name,
        avatar_url=avatar_url,
        access_token=access_token,
        refresh_token=refresh_token,
        token_expires_at=token_expires_at,
    )

    # Create app JWT
    jwt_token = create_jwt(user["id"], user["email"])

    # Strip sensitive fields for response
    user_out = {k: v for k, v in user.items() if k not in (
        "spotify_access_token", "spotify_refresh_token",
        "spotify_token_expires_at", "taste_centroid"
    )}

    return {"token": jwt_token, "user": user_out}
