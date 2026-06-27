CREATE TABLE media (
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
    uploaded_by UUID,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);