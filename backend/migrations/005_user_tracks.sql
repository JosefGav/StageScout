-- Track user's saved songs (from liked songs + playlists) for display on matched events
CREATE TABLE user_tracks (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    artist_id INT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    spotify_track_id VARCHAR(255) NOT NULL,
    track_name VARCHAR(500) NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'liked_songs'
        CHECK (source IN ('liked_songs', 'playlist', 'top_artists')),
    UNIQUE(user_id, spotify_track_id)
);

CREATE INDEX idx_user_tracks_user_artist ON user_tracks(user_id, artist_id);
