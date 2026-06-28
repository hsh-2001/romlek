DO $$
DECLARE
  post_id_type TEXT;
  media_id_type TEXT;
BEGIN
  SELECT format_type(attribute.atttypid, attribute.atttypmod)
  INTO post_id_type
  FROM pg_attribute attribute
  JOIN pg_class class ON class.oid = attribute.attrelid
  JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
  WHERE namespace.nspname = 'public'
    AND class.relname = 'posts'
    AND attribute.attname = 'id'
    AND NOT attribute.attisdropped;

  SELECT format_type(attribute.atttypid, attribute.atttypmod)
  INTO media_id_type
  FROM pg_attribute attribute
  JOIN pg_class class ON class.oid = attribute.attrelid
  JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
  WHERE namespace.nspname = 'public'
    AND class.relname = 'media'
    AND attribute.attname = 'id'
    AND NOT attribute.attisdropped;

  IF post_id_type IS NULL THEN
    RAISE EXCEPTION 'posts.id column is required before post_media migration';
  END IF;

  IF media_id_type IS NULL THEN
    RAISE EXCEPTION 'media.id column is required before post_media migration';
  END IF;

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS post_media (
      post_id %s NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      media_id %s NOT NULL REFERENCES media(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      caption TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (post_id, media_id)
    )',
    post_id_type,
    media_id_type
  );

  CREATE INDEX IF NOT EXISTS post_media_media_id_idx ON post_media(media_id);
  CREATE INDEX IF NOT EXISTS post_media_sort_order_idx ON post_media(post_id, sort_order);
END $$;
