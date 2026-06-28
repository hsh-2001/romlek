DO $$
DECLARE
  user_id_type TEXT;
  uploaded_by_type TEXT;
BEGIN
  SELECT format_type(attribute.atttypid, attribute.atttypmod)
  INTO user_id_type
  FROM pg_attribute attribute
  JOIN pg_class class ON class.oid = attribute.attrelid
  JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
  WHERE namespace.nspname = 'public'
    AND class.relname = 'users'
    AND attribute.attname = 'id'
    AND NOT attribute.attisdropped;

  IF user_id_type IS NULL THEN
    RAISE EXCEPTION 'users.id column is required before media uploader metadata migration';
  END IF;

  SELECT format_type(attribute.atttypid, attribute.atttypmod)
  INTO uploaded_by_type
  FROM pg_attribute attribute
  JOIN pg_class class ON class.oid = attribute.attrelid
  JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
  WHERE namespace.nspname = 'public'
    AND class.relname = 'media'
    AND attribute.attname = 'uploaded_by'
    AND NOT attribute.attisdropped;

  IF uploaded_by_type IS NOT NULL AND uploaded_by_type <> user_id_type THEN
    ALTER TABLE media RENAME COLUMN uploaded_by TO uploaded_by_legacy;
    uploaded_by_type := NULL;
  END IF;

  IF uploaded_by_type IS NULL THEN
    EXECUTE format('ALTER TABLE media ADD COLUMN uploaded_by %s', user_id_type);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'media_uploaded_by_fkey'
  ) THEN
    ALTER TABLE media
      ADD CONSTRAINT media_uploaded_by_fkey
      FOREIGN KEY (uploaded_by)
      REFERENCES users(id)
      ON DELETE SET NULL;
  END IF;
END $$;
