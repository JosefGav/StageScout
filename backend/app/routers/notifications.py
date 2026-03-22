from fastapi import APIRouter, Depends, Request
from app.auth import require_user
from app.services.notification_service import send_digest, get_notification_history
from app.rate_limit import limiter

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.post("/send-digest")
@limiter.limit("5/minute")
def trigger_digest(request: Request, user: dict = Depends(require_user)):
    result = send_digest(user["id"], email_type="on_demand")
    if not result:
        return {"message": "No new matches to send"}
    return result


@router.get("/history")
def notification_history(user: dict = Depends(require_user)):
    return get_notification_history(user["id"])
