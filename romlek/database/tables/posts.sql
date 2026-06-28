CREATE TABLE IF NOT EXISTS posts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
    album_id BIGINT REFERENCES albums(id) ON DELETE SET NULL,
    title TEXT,
    body TEXT NOT NULL DEFAULT '',
    location TEXT,
    travel_date DATE,
    duration TEXT,
    travel_style TEXT,
    companions TEXT,
    budget TEXT,
    highlights TEXT,
    tips TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE posts
    ADD COLUMN IF NOT EXISTS location TEXT,
    ADD COLUMN IF NOT EXISTS album_id BIGINT REFERENCES albums(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS travel_date DATE,
    ADD COLUMN IF NOT EXISTS duration TEXT,
    ADD COLUMN IF NOT EXISTS travel_style TEXT,
    ADD COLUMN IF NOT EXISTS companions TEXT,
    ADD COLUMN IF NOT EXISTS budget TEXT,
    ADD COLUMN IF NOT EXISTS highlights TEXT,
    ADD COLUMN IF NOT EXISTS tips TEXT;

CREATE INDEX IF NOT EXISTS posts_user_id_idx ON posts(user_id);
CREATE INDEX IF NOT EXISTS posts_trip_id_idx ON posts(trip_id);
CREATE INDEX IF NOT EXISTS posts_album_id_idx ON posts(album_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);
