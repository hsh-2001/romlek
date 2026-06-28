DO $$
DECLARE
  user_id_type TEXT;
  trip_id_type TEXT;
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

  SELECT format_type(attribute.atttypid, attribute.atttypmod)
  INTO trip_id_type
  FROM pg_attribute attribute
  JOIN pg_class class ON class.oid = attribute.attrelid
  JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
  WHERE namespace.nspname = 'public'
    AND class.relname = 'trips'
    AND attribute.attname = 'id'
    AND NOT attribute.attisdropped;

  IF user_id_type IS NULL THEN
    RAISE EXCEPTION 'users.id column is required before posts migration';
  END IF;

  IF trip_id_type IS NULL THEN
    RAISE EXCEPTION 'trips.id column is required before posts migration';
  END IF;

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS posts (
      id BIGSERIAL PRIMARY KEY,
      user_id %s REFERENCES users(id) ON DELETE SET NULL,
      trip_id %s REFERENCES trips(id) ON DELETE SET NULL,
      body TEXT NOT NULL DEFAULT '''',
      status VARCHAR(30) NOT NULL DEFAULT ''draft'',
      published_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )',
    user_id_type,
    trip_id_type
  );

  CREATE INDEX IF NOT EXISTS posts_user_id_idx ON posts(user_id);
  CREATE INDEX IF NOT EXISTS posts_trip_id_idx ON posts(trip_id);
  CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);
END $$;
