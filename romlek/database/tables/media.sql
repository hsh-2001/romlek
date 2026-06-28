CREATE TABLE IF NOT EXISTS media (
    id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT,
    mime_type VARCHAR(100) NOT NULL,
    extension VARCHAR(20),
    file_size BIGINT NOT NULL,
    width INTEGER,
    height INTEGER,
    duration INTEGER,
    storage_provider VARCHAR(50) DEFAULT 'local',
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    album_id BIGINT REFERENCES albums(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE media
    ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS album_id BIGINT REFERENCES albums(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS media_uploaded_by_idx ON media(uploaded_by);
CREATE INDEX IF NOT EXISTS media_album_id_idx ON media(album_id);
