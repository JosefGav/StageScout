-- Run AFTER artists have been seeded with audio_features
-- ivfflat requires existing data to build the index
CREATE INDEX idx_artists_audio_features ON artists
    USING ivfflat (audio_features vector_cosine_ops)
    WITH (lists = 50);
