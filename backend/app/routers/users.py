from fastapi import APIRouter, Depends, HTTPException
from app.auth import require_user
from app.schemas import UserUpdate, NotificationPrefsUpdate, SyncStatusOut
from app.services.user_service import (
    update_user, update_notification_prefs, delete_user
)

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me")
def get_me(user: dict = Depends(require_user)):
    safe = {k: v for k, v in user.items() if k not in (
        "spotify_access_token", "spotify_refresh_token",
        "spotify_token_expires_at", "taste_centroid"
    )}
    return safe


@router.put("/me")
def update_me(body: UserUpdate, user: dict = Depends(require_user)):
    updated = update_user(
        user["id"],
        city=body.city,
        latitude=body.latitude,
        longitude=body.longitude,
        search_radius_miles=body.search_radius_miles,
    )
    safe = {k: v for k, v in updated.items() if k not in (
        "spotify_access_token", "spotify_refresh_token",
        "spotify_token_expires_at", "taste_centroid"
    )}
    return safe


@router.put("/me/notifications")
def update_notifications(body: NotificationPrefsUpdate, user: dict = Depends(require_user)):
    updated = update_notification_prefs(
        user["id"],
        digest_enabled=body.digest_enabled,
        digest_frequency=body.digest_frequency,
    )
    return {"digest_enabled": updated["digest_enabled"], "digest_frequency": updated["digest_frequency"]}


@router.get("/me/sync-status")
def get_sync_status(user: dict = Depends(require_user)):
    status = user["sync_status"]
    syncing = status != "idle"
    stage = None
    if status == "syncing_stage1":
        stage = 1
    elif status == "syncing_stage2":
        stage = 2
    elif status == "syncing_stage3":
        stage = 3
    return SyncStatusOut(
        syncing=syncing,
        stage=stage,
        artists_found=user["artists_found"],
        last_sync=user["last_spotify_sync"],
    )


@router.post("/me/sync")
def trigger_sync(user: dict = Depends(require_user)):
    from app.services.artist_service import run_full_sync
    import threading

    if user["sync_status"] != "idle":
        raise HTTPException(status_code=409, detail="Sync already in progress")

    thread = threading.Thread(target=run_full_sync, args=(user["id"],), daemon=True)
    thread.start()
    return {"message": "Sync started"}


@router.delete("/me")
def delete_me(user: dict = Depends(require_user)):
    delete_user(user["id"])
    return {"message": "Account deleted"}
