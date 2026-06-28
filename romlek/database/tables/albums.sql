CREATE TABLE IF NOT EXISTS albums (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    code VARCHAR(40) UNIQUE,
    title TEXT NOT NULL DEFAULT 'Album',
    caption TEXT,
    location TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    source_post_id BIGINT UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE albums
    ADD COLUMN IF NOT EXISTS code VARCHAR(40) UNIQUE;

UPDATE albums
SET code = CONCAT('ALB-', LPAD(id::TEXT, 6, '0'))
WHERE code IS NULL OR code = '';

UPDATE albums
SET title = 'Album'
WHERE title IS NULL OR title = '' OR title = caption;

CREATE INDEX IF NOT EXISTS albums_user_id_idx ON albums(user_id);
CREATE INDEX IF NOT EXISTS albums_code_idx ON albums(code);
CREATE INDEX IF NOT EXISTS albums_source_post_id_idx ON albums(source_post_id);
CREATE INDEX IF NOT EXISTS albums_created_at_idx ON albums(created_at DESC);
