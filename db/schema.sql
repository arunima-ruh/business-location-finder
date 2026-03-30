-- Business Location Finder Database Schema

-- Searches table: stores user location searches
CREATE TABLE IF NOT EXISTS searches (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    query VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_phone_created (phone_number, created_at DESC)
);

-- Businesses table: stores found businesses
CREATE TABLE IF NOT EXISTS businesses (
    id SERIAL PRIMARY KEY,
    search_id INTEGER NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
    place_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    rating DECIMAL(2, 1),
    open_now BOOLEAN,
    types JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(search_id, place_id),
    INDEX idx_search_id (search_id),
    INDEX idx_place_id (place_id)
);

-- User sessions table: stores temporary location data
CREATE TABLE IF NOT EXISTS user_sessions (
    phone_number VARCHAR(20) PRIMARY KEY,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location_name VARCHAR(255),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_businesses_rating ON businesses(rating DESC);
CREATE INDEX IF NOT EXISTS idx_searches_query ON searches(query);
