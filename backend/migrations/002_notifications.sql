-- ============================================================
-- NOTIFICATION_LOG
-- ============================================================
CREATE TABLE notification_log (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_type VARCHAR(50) NOT NULL
        CHECK (email_type IN ('weekly_digest', 'daily_digest', 'on_demand')),
    match_count INT NOT NULL DEFAULT 0,
    sent_at TIMESTAMP DEFAULT NOW(),
    resend_message_id VARCHAR(255)
);

CREATE INDEX idx_notifications_user ON notification_log(user_id);

-- ============================================================
-- JOB_RUNS
-- ============================================================
CREATE TABLE job_runs (
    id SERIAL PRIMARY KEY,
    job_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'running'
        CHECK (status IN ('running', 'completed', 'failed')),
    events_fetched INT DEFAULT 0,
    matches_created INT DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
