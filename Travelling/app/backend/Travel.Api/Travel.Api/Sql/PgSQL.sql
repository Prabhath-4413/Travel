
-- ========================================
-- Travel App Database Schema (PostgreSQL)
-- Complete Schema matching EF Core Configuration
-- ========================================

-- =====================
-- Users table
-- =====================
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL DEFAULT '',
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    google_id VARCHAR(255),
    picture VARCHAR(500),
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- Destinations table
-- =====================
CREATE TABLE IF NOT EXISTS destinations (
    destination_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    image_url TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- Travel Packages table
-- =====================
CREATE TABLE IF NOT EXISTS travel_packages (
    package_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    image_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- Travel Package Destinations (many-to-many)
-- =====================
CREATE TABLE IF NOT EXISTS travel_package_destinations (
    package_id INT NOT NULL REFERENCES travel_packages(package_id) ON DELETE CASCADE,
    destination_id INT NOT NULL REFERENCES destinations(destination_id) ON DELETE CASCADE,
    PRIMARY KEY (package_id, destination_id)
);

-- =====================
-- Bookings table
-- =====================
CREATE TABLE IF NOT EXISTS bookings (
    booking_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    total_price NUMERIC(10,2) NOT NULL,
    guests INT NOT NULL CHECK (guests > 0),
    nights INT NOT NULL CHECK (nights > 0),
    booking_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "StartDate" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
    status INT NOT NULL DEFAULT 0,
    "CancellationStatus" INT NOT NULL DEFAULT 0,
    rating INT,
    review TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- =====================
-- Booking Destinations (many-to-many)
-- =====================
CREATE TABLE IF NOT EXISTS booking_destinations (
    booking_id INT NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
    destination_id INT NOT NULL REFERENCES destinations(destination_id) ON DELETE CASCADE,
    PRIMARY KEY (booking_id, destination_id)
);

-- =====================
-- Trip Cancellations table
-- =====================
CREATE TABLE IF NOT EXISTS trip_cancellations (
    trip_cancellation_id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reason VARCHAR(1000),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    status INT NOT NULL DEFAULT 0,
    admin_comment VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- Reviews table
-- =====================
CREATE TABLE IF NOT EXISTS reviews (
    review_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    destination_id INT NOT NULL REFERENCES destinations(destination_id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, destination_id)
);

-- =====================
-- Booking OTPs table
-- =====================
CREATE TABLE IF NOT EXISTS booking_otps (
    booking_otp_id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    booking_id INT NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
    otp VARCHAR(6) NOT NULL,
    expiry TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- Reschedule OTPs table
-- =====================
CREATE TABLE IF NOT EXISTS reschedule_otps (
    reschedule_otp_id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    booking_id INT NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
    otp VARCHAR(6) NOT NULL,
    "NewStartDate" TIMESTAMPTZ NOT NULL,
    "NewDestinationId" INT,
    expiry TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);
CREATE INDEX idx_bookings_start_date ON bookings("StartDate");
CREATE INDEX idx_booking_destinations_dest_id ON booking_destinations(destination_id);
CREATE INDEX idx_travel_package_destinations_package_id ON travel_package_destinations(package_id);
CREATE INDEX idx_trip_cancellations_booking_id ON trip_cancellations(booking_id);
CREATE INDEX idx_trip_cancellations_user_id ON trip_cancellations(user_id);
CREATE INDEX idx_reviews_destination_id ON reviews(destination_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_destinations_name ON destinations(name);
CREATE INDEX idx_users_email ON users(email);

-- =====================
-- SEED DATA
-- =====================

-- Default admin user
INSERT INTO users (name, email, password, role) VALUES 
('Admin', 'admin@travelapp.com', '$2a$11$dummy', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Sample destinations
INSERT INTO destinations (name, description, price, image_url, city, country, latitude, longitude) VALUES
('Goa Coastline Escape', 'Golden beaches, vibrant shacks, and Portuguese heritage for a sun-soaked getaway.', 5200.00, 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200&auto=format&fit=crop', 'Goa', 'India', 15.2993, 74.1240),
('Munnar Tea Highlands', 'Mist-covered mountains, endless tea gardens, and cool breezes in Kerala''s hill country.', 4000.00, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', 'Munnar', 'India', 10.0889, 77.0595),
('Jaipur Royal Circuit', 'The Pink City''s palaces, royal bazaars, and forts wrapped in Rajasthan heritage.', 4800.00, 'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=1200&auto=format&fit=crop', 'Jaipur', 'India', 26.9124, 75.7873),
('Bali Island Retreat', 'Balinese temples, terraced rice fields, and sunset beaches for an island escape.', 18500.00, 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1200&auto=format&fit=crop', 'Bali', 'Indonesia', -8.3405, 115.0920),
('Paris City Lights', 'Iconic boulevards, cafés, and museums in the heart of the City of Light.', 45000.00, 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop', 'Paris', 'France', 48.8566, 2.3522),
('Santorini Sunset Escape', 'Blue-domed churches, whitewashed cliffs, and legendary caldera sunsets.', 52000.00, 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?q=80&w=1200&auto=format&fit=crop', 'Santorini', 'Greece', 36.3932, 25.4615),
('Tokyo Urban Explorer', 'Neon-lit streets, ancient temples, and cutting-edge technology in Japan''s capital.', 65000.00, 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200&auto=format&fit=crop', 'Tokyo', 'Japan', 35.6762, 139.6503),
('Swiss Alps Adventure', 'Snow-capped peaks, crystal-clear lakes, and charming alpine villages.', 55000.00, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop', 'Interlaken', 'Switzerland', 46.8182, 8.2275),
('Dubai Luxury Experience', 'Iconic skyscrapers, desert safaris, and world-class shopping in the UAE.', 58000.00, 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop', 'Dubai', 'UAE', 25.2048, 55.2708),
('Machu Picchu Trek', 'Ancient Incan citadel, Andean mountains, and mystical cloud forests.', 42000.00, 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=1200&auto=format&fit=crop', 'Cusco', 'Peru', -13.1631, -72.5450),
('Sydney Harbour Escape', 'Iconic Opera House, Harbour Bridge, and pristine beaches in Australia''s harbor city.', 48000.00, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop', 'Sydney', 'Australia', -33.8688, 151.2093),
('Iceland Northern Lights', 'Glaciers, geysers, waterfalls, and the magical aurora borealis.', 62000.00, 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?q=80&w=1200&auto=format&fit=crop', 'Reykjavik', 'Iceland', 64.9631, -19.0208),
('Maldives Overwater Retreat', 'Turquoise lagoons, coral reefs, and private villas floating above the Indian Ocean.', 72000.00, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80', 'Malé', 'Maldives', 3.2028, 73.2207)
ON CONFLICT (name) DO NOTHING;

-- Sample travel packages
INSERT INTO travel_packages (name, description, price, image_url, created_at) VALUES
('Beach Escape', 'Five-day coastal escape featuring sunrise yoga, local seafood tastings, and resort-style beach villas.', 499.99, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', '2024-01-01 00:00:00+00:00'),
('Mountain Adventure', 'Week-long alpine expedition with guided summit treks, riverside camping, and stargazing under clear skies.', 899.99, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', '2024-01-01 00:00:00+00:00'),
('Cultural Journey', 'Curated heritage trail showcasing palace walkthroughs, artisan workshops, and immersive food tours.', 699.99, 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80', '2024-01-01 00:00:00+00:00'),
('Urban Explorer', 'Modern city vibes with cutting-edge technology, vibrant nightlife, and cultural landmarks.', 799.99, 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200&auto=format&fit=crop', '2024-01-01 00:00:00+00:00'),
('Luxury Worldwide', 'Premium destinations featuring world-class accommodations, exclusive experiences, and personalized service.', 1499.99, 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop', '2024-01-01 00:00:00+00:00'),
('Adventure Seeker', 'Thrilling outdoor activities, breathtaking landscapes, and unforgettable natural wonders.', 1099.99, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop', '2024-01-01 00:00:00+00:00'),
('European Heritage Tour', 'Rich history, architectural marvels, and culinary traditions across Europe''s most iconic cities.', 1199.99, 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop', '2024-01-01 00:00:00+00:00'),
('Iconic Horizons', 'From Maldivian lagoons to Swiss summits and Dubai''s desert skyline, experience three signatures in one itinerary.', 1599.99, 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80', '2024-01-01 00:00:00+00:00')
ON CONFLICT DO NOTHING;

-- Link destinations to packages
INSERT INTO travel_package_destinations (package_id, destination_id) VALUES
(1, 1), (1, 13),
(2, 8), (2, 11),
(3, 2), (3, 3),
(4, 7), (4, 9),
(5, 5), (5, 6), (5, 9),
(6, 4), (6, 8),
(7, 5), (7, 6), (7, 7),
(8, 13), (8, 8), (8, 9)
ON CONFLICT DO NOTHING;
SELECT * FROM bookings
JOIN booking_destinations USING (booking_id);

SELECT * FROM bookings;
SELECT * FROM users;
SELECT * FROM destinations;
SELECT * FROM travel_package_destinations;
SELECT * FROM trip_cancellations;
SELECT * FROM reviews;
SELECT * FROM booking_otps;
SELECT * FROM reschedule_otps;
SELECT * FROM current_database();

SELECT * FROM public.bookings;

SELECT table_schema, table_name 
FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog', 'information_schema');




