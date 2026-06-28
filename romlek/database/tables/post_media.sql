CREATE TABLE IF NOT EXISTS post_media (
    post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    media_id BIGINT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    caption TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (post_id, media_id)
);

CREATE INDEX IF NOT EXISTS post_media_media_id_idx ON post_media(media_id);
CREATE INDEX IF NOT EXISTS post_media_sort_order_idx ON post_media(post_id, sort_order);
