CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    spotify_id VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    city VARCHAR(255),
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    search_radius_miles INT NOT NULL DEFAULT 50,
    digest_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    digest_frequency VARCHAR(20) NOT NULL DEFAULT 'weekly'
        CHECK (digest_frequency IN ('daily', 'weekly', 'never')),
    taste_centroid VECTOR(11),
    spotify_access_token TEXT,
    spotify_refresh_token TEXT,
    spotify_token_expires_at TIMESTAMP,
    last_spotify_sync TIMESTAMP,
    sync_status VARCHAR(20) NOT NULL DEFAULT 'idle'
        CHECK (sync_status IN ('idle', 'syncing_stage1', 'syncing_stage2', 'syncing_stage3')),
    artists_found INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- GENRES
-- ============================================================
CREATE TABLE genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    spotify_id VARCHAR(255) UNIQUE
);

-- ============================================================
-- ARTISTS
-- ============================================================
CREATE TABLE artists (
    id SERIAL PRIMARY KEY,
    spotify_id VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    name_normalized VARCHAR(255) NOT NULL,
    image_url VARCHAR(500),
    popularity INT,
    audio_features VECTOR(11),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_artists_name_normalized ON artists(name_normalized);
CREATE INDEX idx_artists_name_trgm ON artists USING gin(name_normalized gin_trgm_ops);

-- ============================================================
-- ARTIST_GENRES (many-to-many)
-- ============================================================
CREATE TABLE artist_genres (
    artist_id INT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    genre_id INT NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (artist_id, genre_id)
);

-- ============================================================
-- RELATED_ARTISTS (from Spotify Related Artists API)
-- ============================================================
CREATE TABLE related_artists (
    artist_id INT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    related_artist_id INT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    PRIMARY KEY (artist_id, related_artist_id),
    CONSTRAINT no_self_relation CHECK (artist_id != related_artist_id)
);

CREATE INDEX idx_related_artists_related ON related_artists(related_artist_id);

-- ============================================================
-- USER_ARTISTS (which artists a user listens to)
-- ============================================================
CREATE TABLE user_artists (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    artist_id INT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL DEFAULT 'liked_songs'
        CHECK (source IN ('liked_songs', 'playlist', 'top_artists', 'manual')),
    play_weight DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    synced_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, artist_id)
);

CREATE INDEX idx_user_artists_user ON user_artists(user_id);
CREATE INDEX idx_user_artists_artist ON user_artists(artist_id);

-- ============================================================
-- USER_RECOMMENDED_ARTISTS (top 50 per user, recomputed weekly)
-- ============================================================
CREATE TABLE user_recommended_artists (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    artist_id INT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    similarity_score DECIMAL(5,4) NOT NULL,
    ranked_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, artist_id)
);

CREATE INDEX idx_user_recommended_user ON user_recommended_artists(user_id);

-- ============================================================
-- VENUES
-- ============================================================
CREATE TABLE venues (
    id SERIAL PRIMARY KEY,
    ticketmaster_id VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'US',
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    address VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_venues_city ON venues(city);

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    ticketmaster_id VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(500) NOT NULL,
    event_date TIMESTAMP NOT NULL,
    on_sale_date TIMESTAMP,
    price_min DECIMAL(10,2),
    price_max DECIMAL(10,2),
    ticket_url VARCHAR(1000),
    image_url VARCHAR(500),
    venue_id INT REFERENCES venues(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'cancelled', 'postponed', 'rescheduled')),
    fetched_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_active ON events(status) WHERE status = 'active';

-- ============================================================
-- EVENT_ARTISTS (many-to-many)
-- ============================================================
CREATE TABLE event_artists (
    event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    artist_id INT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    is_headliner BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (event_id, artist_id)
);

CREATE INDEX idx_event_artists_artist ON event_artists(artist_id);

-- ============================================================
-- USER_EVENT_MATCHES (pre-computed by background job)
-- ============================================================
CREATE TABLE user_event_matches (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    match_type VARCHAR(20) NOT NULL
        CHECK (match_type IN ('exact', 'similar')),
    matched_artist_id INT REFERENCES artists(id),
    event_artist_id INT REFERENCES artists(id),
    similarity_score DECIMAL(5,4),
    notified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, event_id, matched_artist_id, event_artist_id)
);

CREATE INDEX idx_matches_user ON user_event_matches(user_id);
CREATE INDEX idx_matches_unnotified ON user_event_matches(user_id, notified)
    WHERE notified = FALSE;
