INSERT INTO albums (user_id, code, title, caption, location, status, source_post_id, created_at, updated_at)
SELECT
    p.user_id,
    CONCAT('ALB-P', LPAD(p.id::TEXT, 6, '0')),
    'Album',
    p.body,
    p.location,
    p.status,
    p.id,
    p.created_at,
    p.updated_at
FROM posts p
JOIN post_media pm ON pm.post_id = p.id
LEFT JOIN albums existing_album ON existing_album.source_post_id = p.id
WHERE p.album_id IS NULL
  AND existing_album.id IS NULL
GROUP BY p.id
HAVING COUNT(pm.media_id) > 1;

UPDATE posts p
SET album_id = a.id,
    updated_at = CURRENT_TIMESTAMP
FROM albums a
WHERE p.album_id IS NULL
  AND a.source_post_id = p.id;

UPDATE media m
SET album_id = p.album_id,
    updated_at = CURRENT_TIMESTAMP
FROM post_media pm
JOIN posts p ON p.id = pm.post_id
WHERE m.id = pm.media_id
  AND p.album_id IS NOT NULL
  AND m.album_id IS DISTINCT FROM p.album_id;
