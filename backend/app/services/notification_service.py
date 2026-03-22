import os
import logging
from html import escape as html_escape
from urllib.parse import urlparse
import resend
from app.db import query, execute

logger = logging.getLogger(__name__)

resend.api_key = os.environ.get("RESEND_API_KEY", "")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "noreply@example.com")


def send_digest(user_id: int, email_type: str = "weekly_digest") -> dict | None:
    """Send digest email with unnotified matches."""
    from app.services.match_service import get_matched_events

    user = query("""
        SELECT id, email, display_name FROM users WHERE id = %s
    """, (user_id,))
    if not user:
        return None
    user = user[0]

    # Get unnotified exact matches
    matches = query("""
        SELECT m.*, e.name as event_name, e.event_date, e.ticket_url,
            a.name as artist_name, v.name as venue_name, v.city as venue_city
        FROM user_event_matches m
        JOIN events e ON e.id = m.event_id
        LEFT JOIN artists a ON a.id = m.matched_artist_id
        LEFT JOIN venues v ON v.id = e.venue_id
        WHERE m.user_id = %s AND m.notified = FALSE AND m.match_type = 'exact'
        ORDER BY e.event_date ASC
    """, (user_id,))

    if not matches:
        return None

    # Build email HTML
    html = _build_digest_html(user["display_name"], matches)

    try:
        result = resend.Emails.send({
            "from": FROM_EMAIL,
            "to": [user["email"]],
            "subject": f"🎵 {len(matches)} upcoming concerts from your artists!",
            "html": html,
        })

        message_id = result.get("id", "") if isinstance(result, dict) else ""

        # Log notification
        execute("""
            INSERT INTO notification_log (user_id, email_type, match_count, resend_message_id)
            VALUES (%s, %s, %s, %s)
        """, (user_id, email_type, len(matches), message_id))

        # Mark matches as notified
        match_ids = [m["id"] for m in matches]
        execute("""
            UPDATE user_event_matches SET notified = TRUE
            WHERE id = ANY(%s)
        """, (match_ids,))

        return {"sent": True, "match_count": len(matches)}

    except Exception as e:
        logger.error(f"Failed to send digest to user {user_id}: {e}")
        return {"sent": False, "error": "Failed to send digest email"}


def _safe_ticket_url(url: str) -> str:
    """Only allow http/https ticket URLs."""
    try:
        parsed = urlparse(url)
        if parsed.scheme in ("http", "https"):
            return url
    except Exception:
        pass
    return ""


def _build_digest_html(display_name: str, matches: list) -> str:
    rows = ""
    for m in matches:
        date_str = m["event_date"].strftime("%b %d, %Y") if m.get("event_date") else "TBD"
        venue_name = html_escape(m.get("venue_name", ""))
        venue_city = html_escape(m.get("venue_city", ""))
        venue = f"{venue_name} — {venue_city}" if venue_name else ""
        artist_name = html_escape(m.get("artist_name", ""))
        event_name = html_escape(m.get("event_name", ""))

        ticket = ""
        if m.get("ticket_url"):
            safe_url = _safe_ticket_url(m["ticket_url"])
            if safe_url:
                ticket = f'<a href="{html_escape(safe_url)}">Get Tickets</a>'

        rows += f"""
        <tr>
            <td style="padding:12px;border-bottom:1px solid #2a2d35;">
                <strong>{artist_name}</strong><br>
                <span style="color:#8a8a92;">{event_name}</span><br>
                <span style="color:#8a8a92;">{html_escape(date_str)} · {venue}</span><br>
                {ticket}
            </td>
        </tr>"""

    return f"""
    <div style="background:#0f1115;color:#e8e8e8;padding:32px;font-family:Inter,sans-serif;">
        <h1 style="color:#4a90d9;">Hey {html_escape(display_name)}!</h1>
        <p>We found {len(matches)} upcoming concerts from artists you listen to:</p>
        <table style="width:100%;border-collapse:collapse;">
            {rows}
        </table>
        <p style="margin-top:24px;color:#8a8a92;font-size:12px;">
            You're receiving this because you have digest notifications enabled.
        </p>
    </div>
    """


def get_notification_history(user_id: int) -> list:
    return query("""
        SELECT id, email_type, match_count, sent_at, resend_message_id
        FROM notification_log
        WHERE user_id = %s
        ORDER BY sent_at DESC
        LIMIT 50
    """, (user_id,))
