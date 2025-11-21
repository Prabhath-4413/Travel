

-- ========================================
-- Travel App Database Schema (PostgreSQL, EF Core Friendly)
-- Fully Corrected Version
-- ========================================

-- =====================
-- Users table
-- =====================
CREATE TABLE IF NOT EXISTS Users (
    UserId INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    Role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (Role IN ('user', 'admin')),
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- Destinations table
-- =====================
CREATE TABLE IF NOT EXISTS Destinations (
    DestinationId SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL UNIQUE,
    Description TEXT,
    Price NUMERIC(10,2) NOT NULL CHECK (Price >= 0),
    ImageUrl TEXT,
    Latitude NUMERIC(9,6),
    Longitude NUMERIC(9,6),
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- Bookings table
-- =====================
CREATE TABLE IF NOT EXISTS Bookings (
    BookingId SERIAL PRIMARY KEY,
    UserId INT NOT NULL REFERENCES Users(UserId) ON DELETE CASCADE,
    TotalPrice NUMERIC(10,2) NOT NULL CHECK (TotalPrice >= 0),
    Guests INT NOT NULL CHECK (Guests > 0),
    Nights INT NOT NULL CHECK (Nights > 0),
    BookingDate TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    Confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    ReminderSent BOOLEAN NOT NULL DEFAULT FALSE,
    CancellationStatus INT NOT NULL DEFAULT 0 CHECK (CancellationStatus IN (0,1,2)),
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- BookingDestinations table (many-to-many)
-- =====================
CREATE TABLE IF NOT EXISTS BookingDestinations (
    BookingId INT NOT NULL REFERENCES Bookings(BookingId) ON DELETE CASCADE,
    DestinationId INT NOT NULL REFERENCES Destinations(DestinationId) ON DELETE CASCADE,
    PRIMARY KEY (BookingId, DestinationId)
);

-- =====================
-- TripCancellations table
-- =====================
CREATE TABLE IF NOT EXISTS TripCancellations (
    TripCancellationId SERIAL PRIMARY KEY,
    BookingId INT NOT NULL REFERENCES Bookings(BookingId) ON DELETE CASCADE,
    UserId INT NOT NULL REFERENCES Users(UserId) ON DELETE CASCADE,
    Reason VARCHAR(1000),
    RequestedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ReviewedAt TIMESTAMPTZ,
    Status INT NOT NULL DEFAULT 0 CHECK (Status IN (0,1,2)),
    AdminComment VARCHAR(1000)
);

-- =====================
-- Reviews table (for Feature 4)
-- =====================
CREATE TABLE IF NOT EXISTS Reviews (
    ReviewId SERIAL PRIMARY KEY,
    UserId INT NOT NULL REFERENCES Users(UserId) ON DELETE CASCADE,
    DestinationId INT NOT NULL REFERENCES Destinations(DestinationId) ON DELETE CASCADE,
    Rating INT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Comment TEXT,
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(UserId, DestinationId) -- Optional: one review per user per destination
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON Bookings(UserId);
CREATE INDEX IF NOT EXISTS idx_bookingdest_dest_id ON BookingDestinations(DestinationId);
CREATE INDEX IF NOT EXISTS idx_tripcancellations_booking_id ON TripCancellations(BookingId);
CREATE INDEX IF NOT EXISTS idx_tripcancellations_user_id ON TripCancellations(UserId);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON Bookings(BookingDate);
CREATE INDEX IF NOT EXISTS idx_reviews_dest_id ON Reviews(DestinationId);

-- =====================
-- SEED DATA
-- =====================
-- Default admin user
INSERT INTO Users (Name, Email, Password, Role)
VALUES ('Admin', 'admin@travelapp.com', '[HashedPasswordHere]', 'admin')
ON CONFLICT (Email) DO NOTHING;

-- Sample destinations
INSERT INTO Destinations (Name, Description, Price, ImageUrl)
VALUES
('Goa Beach', 'Relaxing beach in Goa', 1500.00, 'https://example.com/goa.jpg'),
('Taj Mahal', 'Historic monument in Agra', 2000.00, 'https://example.com/tajmahal.jpg'),
('Kerala Backwaters', 'Beautiful backwaters in Kerala', 1800.00, 'https://example.com/kerala.jpg')
ON CONFLICT (Name) DO NOTHING;

-- =====================
-- PARAMETERIZED QUERY EXAMPLES
-- =====================
-- Insert a booking
INSERT INTO Bookings 
(UserId, TotalPrice, Guests, Nights, BookingDate, Confirmed, ReminderSent, CancellationStatus)
VALUES 
(@UserId, @TotalPrice, @Guests, @Nights, @BookingDate, @Confirmed, @ReminderSent, @CancellationStatus)
RETURNING BookingId;

-- Insert booking destinations (many-to-many)
INSERT INTO BookingDestinations (BookingId, DestinationId)
VALUES (@BookingId, @DestinationId);

-- Insert trip cancellation
INSERT INTO TripCancellations 
(BookingId, UserId, Reason, RequestedAt, Status, AdminComment)
VALUES (@BookingId, @UserId, @Reason, @RequestedAt, @Status, @AdminComment);

-- Insert review
INSERT INTO Reviews (UserId, DestinationId, Rating, Comment)
VALUES (@UserId, @DestinationId, @Rating, @Comment)
RETURNING ReviewId;

-- =====================
-- SELECT QUERIES
-- =====================
-- Get all destinations
SELECT DestinationId, Name, Description, Price, ImageUrl, Latitude, Longitude
FROM Destinations
ORDER BY Name;

-- Get single destination by id
SELECT DestinationId, Name, Description, Price, ImageUrl, Latitude, Longitude
FROM Destinations
WHERE DestinationId = @DestinationId;

-- Get user bookings with destinations and end date
SELECT
    b.BookingId,
    b.TotalPrice,
    b.Guests,
    b.Nights,
    b.BookingDate AS StartDate,
    (b.BookingDate + (b.Nights || ' days')::interval) AS EndDate,
    ARRAY_AGG(d.Name ORDER BY d.Name) AS Destinations,
    u.Name AS UserName,
    u.Email AS UserEmail
FROM Bookings b
JOIN Users u ON u.UserId = b.UserId
JOIN BookingDestinations bd ON bd.BookingId = b.BookingId
JOIN Destinations d ON d.DestinationId = bd.DestinationId
WHERE b.UserId = @UserId
GROUP BY b.BookingId, b.TotalPrice, b.Guests, b.Nights, b.BookingDate, u.Name, u.Email
ORDER BY b.BookingId DESC;

-- Admin: bookings summary
SELECT
    COUNT(*) AS TotalBookings,
    COALESCE(SUM(b.TotalPrice), 0) AS TotalRevenue,
    COALESCE(AVG(b.TotalPrice), 0) AS AverageBookingValue
FROM Bookings b;

-- Admin: recent bookings with user and destinations (limit 30)
SELECT
    b.BookingId,
    u.Name AS UserName,
    u.Email AS UserEmail,
    b.TotalPrice,
    b.Guests,
    b.Nights,
    b.BookingDate,
    ARRAY_AGG(d.Name ORDER BY d.Name) AS Destinations
FROM Bookings b
JOIN Users u ON u.UserId = b.UserId
JOIN BookingDestinations bd ON bd.BookingId = b.BookingId
JOIN Destinations d ON d.DestinationId = bd.DestinationId
GROUP BY b.BookingId, u.Name, u.Email, b.TotalPrice, b.Guests, b.Nights, b.BookingDate
ORDER BY b.BookingDate DESC
LIMIT 30;
