CREATE TABLE trip_locations (
    id SERIAL PRIMARY KEY,
    trip_id INT NOT NULL REFERENCES trips(id),
    location_name VARCHAR(255) NOT NULL,
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
)