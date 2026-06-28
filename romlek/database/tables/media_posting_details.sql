DO $$
DECLARE
  media_id_type TEXT;
BEGIN
  SELECT format_type(attribute.atttypid, attribute.atttypmod)
  INTO media_id_type
  FROM pg_attribute attribute
  JOIN pg_class class ON class.oid = attribute.attrelid
  JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
  WHERE namespace.nspname = 'public'
    AND class.relname = 'media'
    AND attribute.attname = 'id'
    AND NOT attribute.attisdropped;

  IF media_id_type IS NULL THEN
    RAISE EXCEPTION 'media.id column is required before media_posting_details migration';
  END IF;

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS media_posting_details (
      media_id %s PRIMARY KEY REFERENCES media(id) ON DELETE CASCADE,
      location TEXT NOT NULL,
      caption TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )',
    media_id_type
  );

  CREATE INDEX IF NOT EXISTS media_posting_details_updated_at_idx
    ON media_posting_details(updated_at DESC);
END $$;
