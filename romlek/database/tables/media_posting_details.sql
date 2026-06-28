CREATE TABLE IF NOT EXISTS media_posting_details (
    media_id BIGINT PRIMARY KEY REFERENCES media(id) ON DELETE CASCADE,
    location TEXT NOT NULL,
    caption TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS media_posting_details_updated_at_idx
    ON media_posting_details(updated_at DESC);
