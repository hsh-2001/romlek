CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    destination VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    travel_style VARCHAR(120),
    companions VARCHAR(255),
    budget VARCHAR(120),
    address TEXT,
    google_map_url TEXT,
    place_details TEXT,
    preview_media_url TEXT,
    preview_media_urls JSONB DEFAULT '[]'::jsonb,
    stops TEXT,
    priorities TEXT,
    notes TEXT,
    status VARCHAR(40) DEFAULT 'planning',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE trips ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS travel_style VARCHAR(120);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS companions VARCHAR(255);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS budget VARCHAR(120);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS google_map_url TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS place_details TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS preview_media_url TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS preview_media_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS stops TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS priorities TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS status VARCHAR(40) DEFAULT 'planning';
