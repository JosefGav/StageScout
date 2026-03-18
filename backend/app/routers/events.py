import threading

from fastapi import APIRouter, Depends, HTTPException, Query
from app.auth import require_user
from app.services.event_service import get_events, get_event_by_id
from app.services.match_service import get_matched_events, get_recommended_events, get_event_match_details

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("")
def list_events(
    search: str = None,
    sort_by: str = None,
    sort_dir: str = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: dict = Depends(require_user),
):
    return get_events(search=search, sort_by=sort_by, sort_dir=sort_dir,
                      page=page, per_page=per_page)


@router.get("/matched")
def matched_events(user: dict = Depends(require_user)):
    if not user.get("city"):
        raise HTTPException(status_code=400, detail="Location required")
    return get_matched_events(user["id"])


@router.get("/recommended")
def recommended_events(user: dict = Depends(require_user)):
    if not user.get("city"):
        raise HTTPException(status_code=400, detail="Location required")
    return get_recommended_events(user["id"])


@router.post("/trigger-fetch")
def trigger_fetch(user: dict = Depends(require_user)):
    """Manually trigger the event fetch job in a background thread."""
    from jobs.fetch_events_job import fetch_events_job
    threading.Thread(target=fetch_events_job, daemon=True).start()
    return {"status": "started", "message": "Event fetch job triggered"}


@router.get("/{event_id}")
def get_event(event_id: int, user: dict = Depends(require_user)):
    event = get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    event["matched_artists"] = get_event_match_details(user["id"], event_id)
    return event
