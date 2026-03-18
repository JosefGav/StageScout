from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal


# ============================================================
# Auth
# ============================================================
class SpotifyCallbackRequest(BaseModel):
    code: str
    state: str


class AuthResponse(BaseModel):
    token: str
    user: dict


# ============================================================
# User
# ============================================================
class UserOut(BaseModel):
    id: int
    spotify_id: str
    email: str
    display_name: str
    avatar_url: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    search_radius_miles: int = 50
    digest_enabled: bool = True
    digest_frequency: str = "weekly"
    last_spotify_sync: Optional[datetime] = None
    sync_status: str = "idle"
    artists_found: int = 0
    created_at: Optional[datetime] = None


class UserUpdate(BaseModel):
    city: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    search_radius_miles: Optional[int] = None


class NotificationPrefsUpdate(BaseModel):
    digest_enabled: Optional[bool] = None
    digest_frequency: Optional[str] = None


class SyncStatusOut(BaseModel):
    syncing: bool
    stage: Optional[int] = None
    artists_found: int = 0
    last_sync: Optional[datetime] = None


# ============================================================
# Artist
# ============================================================
class ArtistOut(BaseModel):
    id: int
    spotify_id: str
    name: str
    image_url: Optional[str] = None
    popularity: Optional[int] = None
    event_count: Optional[int] = None


class SimilarArtistOut(BaseModel):
    id: int
    spotify_id: str
    name: str
    image_url: Optional[str] = None
    popularity: Optional[int] = None
    similarity_score: Optional[Decimal] = None


# ============================================================
# Venue
# ============================================================
class VenueOut(BaseModel):
    id: int
    name: str
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = "US"
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    address: Optional[str] = None


# ============================================================
# Event
# ============================================================
class EventOut(BaseModel):
    id: int
    ticketmaster_id: str
    name: str
    event_date: datetime
    on_sale_date: Optional[datetime] = None
    price_min: Optional[Decimal] = None
    price_max: Optional[Decimal] = None
    ticket_url: Optional[str] = None
    image_url: Optional[str] = None
    venue: Optional[VenueOut] = None
    artists: Optional[list] = None
    status: str = "active"


class MatchedEventOut(BaseModel):
    id: int
    event: EventOut
    match_type: str
    matched_artist: Optional[ArtistOut] = None
    similarity_score: Optional[Decimal] = None


# ============================================================
# Notification
# ============================================================
class NotificationOut(BaseModel):
    id: int
    email_type: str
    match_count: int
    sent_at: Optional[datetime] = None


# ============================================================
# Pagination
# ============================================================
class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    per_page: int
    total_pages: int
