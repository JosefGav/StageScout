-- Resize vector columns from VECTOR(11) (Spotify audio features) to VECTOR(50) (Last.fm tag vectors)
-- All existing data is NULL (Spotify pipeline was broken), so no data loss.

DROP INDEX IF EXISTS idx_artists_audio_features;

ALTER TABLE artists DROP COLUMN IF EXISTS audio_features;
ALTER TABLE artists ADD COLUMN audio_features VECTOR(50);

ALTER TABLE users DROP COLUMN IF EXISTS taste_centroid;
ALTER TABLE users ADD COLUMN taste_centroid VECTOR(50);
