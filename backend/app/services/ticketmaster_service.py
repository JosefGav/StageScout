import os
import time
import logging
import threading
import httpx
from app.constants import TICKETMASTER_BASE_URL, TICKETMASTER_DAILY_LIMIT, TICKETMASTER_REQ_PER_SEC

logger = logging.getLogger(__name__)

API_KEY = os.environ.get("TICKETMASTER_API_KEY", "")

_semaphore = threading.Semaphore(TICKETMASTER_REQ_PER_SEC)
_daily_count = 0
_daily_lock = threading.Lock()


def _tm_get(endpoint: str, params: dict = None) -> dict:
    global _daily_count

    with _daily_lock:
        if _daily_count >= TICKETMASTER_DAILY_LIMIT:
            raise Exception("Ticketmaster daily limit reached")
        _daily_count += 1

    if params is None:
        params = {}
    params["apikey"] = API_KEY

    with _semaphore:
        resp = httpx.get(f"{TICKETMASTER_BASE_URL}{endpoint}", params=params, timeout=15)
        if resp.status_code == 429:
            time.sleep(2)
            resp = httpx.get(f"{TICKETMASTER_BASE_URL}{endpoint}", params=params, timeout=15)
        resp.raise_for_status()
        return resp.json()


def search_events(keyword: str = None, city: str = None,
                  lat: float = None, lng: float = None, radius: int = 50,
                  page: int = 0, size: int = 20) -> dict:
    params = {
        "classificationName": "music",
        "sort": "date,asc",
        "page": page,
        "size": size,
    }
    if keyword:
        params["keyword"] = keyword
    if lat and lng:
        params["latlong"] = f"{lat},{lng}"
        params["radius"] = radius
        params["unit"] = "miles"
    elif city:
        params["city"] = city

    return _tm_get("/events.json", params)


def parse_event(raw: dict) -> dict:
    """Parse a Ticketmaster event into our schema."""
    dates = raw.get("dates", {}).get("start", {})
    event_date = dates.get("dateTime") or dates.get("localDate")

    price_ranges = raw.get("priceRanges", [])
    price_min = price_ranges[0].get("min") if price_ranges else None
    price_max = price_ranges[0].get("max") if price_ranges else None

    images = raw.get("images", [])
    # Prefer the widest 16:9 image for banner quality; fall back to widest of any ratio
    wide_images = [img for img in images if img.get("ratio") == "16_9"]
    pool = wide_images or images
    if pool:
        image_url = max(pool, key=lambda img: img.get("width", 0)).get("url")
    else:
        image_url = None

    ticket_url = raw.get("url")

    sales = raw.get("sales", {}).get("public", {})
    on_sale_date = sales.get("startDateTime")

    status = raw.get("dates", {}).get("status", {}).get("code", "active")
    status_map = {"onsale": "active", "offsale": "active", "canceled": "cancelled",
                  "cancelled": "cancelled", "postponed": "postponed", "rescheduled": "rescheduled"}
    status = status_map.get(status, "active")

    # Extract artists
    attractions = raw.get("_embedded", {}).get("attractions", [])
    artists = []
    for i, a in enumerate(attractions):
        artists.append({
            "name": a.get("name", ""),
            "ticketmaster_id": a.get("id"),
            "is_headliner": i == 0,
        })

    # Extract venue
    venues = raw.get("_embedded", {}).get("venues", [])
    venue = None
    if venues:
        v = venues[0]
        location = v.get("location", {})
        venue = {
            "ticketmaster_id": v.get("id"),
            "name": v.get("name", ""),
            "city": v.get("city", {}).get("name"),
            "state": v.get("state", {}).get("name"),
            "country": v.get("country", {}).get("countryCode", "US"),
            "latitude": location.get("latitude"),
            "longitude": location.get("longitude"),
            "address": v.get("address", {}).get("line1"),
        }

    return {
        "ticketmaster_id": raw.get("id"),
        "name": raw.get("name", ""),
        "event_date": event_date,
        "on_sale_date": on_sale_date,
        "price_min": price_min,
        "price_max": price_max,
        "ticket_url": ticket_url,
        "image_url": image_url,
        "status": status,
        "artists": artists,
        "venue": venue,
    }


def reset_daily_count():
    global _daily_count
    with _daily_lock:
        _daily_count = 0
