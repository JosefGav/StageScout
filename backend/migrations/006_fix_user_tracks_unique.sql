-- Fix: allow same track to be stored under multiple artists (feat/collab tracks)
-- Old constraint: UNIQUE(user_id, spotify_track_id) — drops tracks for 2nd+ artist
-- New constraint: UNIQUE(user_id, artist_id, spotify_track_id)
ALTER TABLE user_tracks DROP CONSTRAINT IF EXISTS user_tracks_user_id_spotify_track_id_key;
ALTER TABLE user_tracks ADD CONSTRAINT user_tracks_user_artist_track_key UNIQUE(user_id, artist_id, spotify_track_id);
