-- Add match quality tracking to event_artists
ALTER TABLE event_artists
    ADD COLUMN IF NOT EXISTS match_quality VARCHAR(20) NOT NULL DEFAULT 'exact_name'
        CHECK (match_quality IN ('exact_name', 'fuzzy'));
