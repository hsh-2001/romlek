CREATE TABLE IF NOT EXISTS posts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
    body TEXT NOT NULL DEFAULT '',
    location TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE posts
    ADD COLUMN IF NOT EXISTS location TEXT;

CREATE INDEX IF NOT EXISTS posts_user_id_idx ON posts(user_id);
CREATE INDEX IF NOT EXISTS posts_trip_id_idx ON posts(trip_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);
