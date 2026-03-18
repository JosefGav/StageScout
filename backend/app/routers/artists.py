from fastapi import APIRouter, Depends, HTTPException
from app.auth import require_user
from app.services.artist_service import get_user_artists, get_artist_by_id
from app.services.recommendation_service import get_similar_artists, get_user_recommended_artists

router = APIRouter(prefix="/api/artists", tags=["artists"])


@router.get("/me")
def my_artists(user: dict = Depends(require_user)):
    return get_user_artists(user["id"])


@router.get("/me/recommended")
def my_recommended(user: dict = Depends(require_user)):
    return get_user_recommended_artists(user["id"])


@router.get("/{artist_id}")
def get_artist(artist_id: int):
    artist = get_artist_by_id(artist_id)
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    return artist


@router.get("/{artist_id}/similar")
def similar_artists(artist_id: int, limit: int = 20):
    artist = get_artist_by_id(artist_id)
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    return get_similar_artists(artist_id, limit=limit)
