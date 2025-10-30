-- ========================================
-- Travel App Database Schema (EF Core Friendly)
-- Updated Version
-- ========================================

-- =====================
-- Users table
-- =====================
CREATE TABLE IF NOT EXISTS "Users" (
    "user_id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL DEFAULT '',
    "Email" VARCHAR(100) NOT NULL UNIQUE,
    "Password" VARCHAR(255) NOT NULL,
    "Role" VARCHAR(50) NOT NULL DEFAULT 'user',
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- Destinations table
-- =====================
CREATE TABLE IF NOT EXISTS "Destinations" (
    "destination_id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Description" TEXT NULL,
    "Price" NUMERIC(10,2) NOT NULL DEFAULT 0,
    "ImageUrl" TEXT NULL,
    "Latitude" NUMERIC(9,6) NULL,
    "Longitude" NUMERIC(9,6) NULL,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- Bookings table
-- =====================
CREATE TABLE IF NOT EXISTS "Bookings" (
    "booking_id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL REFERENCES "Users"("user_id") ON DELETE CASCADE,
    "TotalPrice" NUMERIC(10,2) NOT NULL,
    "Guests" INTEGER NOT NULL,
    "Nights" INTEGER NOT NULL,
    "BookingDate" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "Confirmed" BOOLEAN NOT NULL DEFAULT FALSE,
    "ReminderSent" BOOLEAN NOT NULL DEFAULT FALSE,
    "CancellationStatus" INTEGER NOT NULL DEFAULT 0,
    -- Optional progress status for UI badges
    "Status" INTEGER NOT NULL DEFAULT 0,
    -- Rating and review after completion
    "Rating" INTEGER NULL,
    "Review" TEXT NULL,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- BookingDestinations table (many-to-many)
-- =====================
CREATE TABLE IF NOT EXISTS "BookingDestinations" (
    "booking_id" INTEGER NOT NULL REFERENCES "Bookings"("booking_id") ON DELETE CASCADE,
    "destination_id" INTEGER NOT NULL REFERENCES "Destinations"("destination_id") ON DELETE CASCADE,
    PRIMARY KEY ("booking_id","destination_id")
);

-- =====================
-- TripCancellations table
-- =====================
CREATE TABLE IF NOT EXISTS "TripCancellations" (
    "trip_cancellation_id" SERIAL PRIMARY KEY,
    "booking_id" INTEGER NOT NULL REFERENCES "Bookings"("booking_id") ON DELETE CASCADE,
    "user_id" INTEGER NOT NULL REFERENCES "Users"("user_id") ON DELETE CASCADE,
    "Reason" VARCHAR(1000),
    "RequestedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "ReviewedAt" TIMESTAMPTZ,
    "Status" INTEGER NOT NULL DEFAULT 0,
    "AdminComment" VARCHAR(1000)
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON "Bookings" ("user_id");
CREATE INDEX IF NOT EXISTS idx_bookingdest_dest_id ON "BookingDestinations" ("destination_id");
CREATE INDEX IF NOT EXISTS idx_tripcancellations_booking_id ON "TripCancellations" ("booking_id");
CREATE INDEX IF NOT EXISTS idx_tripcancellations_user_id ON "TripCancellations" ("user_id");

-- =====================
-- SEED DATA
-- =====================
-- Default admin user
INSERT INTO "Users" ("Name","Email","Password","Role")
VALUES ('Admin','admin@travelapp.com','[HashedPasswordHere]','admin')
ON CONFLICT ("Email") DO NOTHING;

-- Sample destinations
INSERT INTO "Destinations" ("Name","Description","Price","ImageUrl")
VALUES
('Goa Beach', 'Relaxing beach in Goa', 1500.00, 'https://example.com/goa.jpg'),
('Taj Mahal', 'Historic monument in Agra', 2000.00, 'https://example.com/tajmahal.jpg'),
('Kerala Backwaters', 'Beautiful backwaters in Kerala', 1800.00, 'https://example.com/kerala.jpg')
ON CONFLICT ("Name") DO NOTHING;

-- =====================
-- PARAMETERIZED QUERIES EXAMPLES
-- =====================
-- Insert a booking
INSERT INTO "Bookings" 
("user_id","TotalPrice","Guests","Nights","BookingDate","Confirmed","ReminderSent","CancellationStatus")
VALUES 
(@UserId,@TotalPrice,@Guests,@Nights,@BookingDate,@Confirmed,@ReminderSent,@CancellationStatus)
RETURNING "booking_id";

-- Insert booking destinations (many-to-many)
INSERT INTO "BookingDestinations" ("booking_id","destination_id")
VALUES (@BookingId,@DestinationId);

-- Insert trip cancellation
INSERT INTO "TripCancellations" 
("booking_id","user_id","Reason","RequestedAt","Status","AdminComment")
VALUES 
(@BookingId,@UserId,@Reason,@RequestedAt,@Status,@AdminComment);

-- =====================
-- SELECT QUERIES
-- =====================
-- Get all destinations
SELECT "destination_id","Name","Description","Price","ImageUrl","Latitude","Longitude"
FROM "Destinations"
ORDER BY "Name";

-- Get single destination by id
SELECT "destination_id","Name","Description","Price","ImageUrl","Latitude","Longitude"
FROM "Destinations"
WHERE "destination_id" = @DestinationId;

-- Get user bookings with destinations and end date
SELECT
    b."booking_id",
    b."TotalPrice",
    b."Guests",
    b."Nights",
    b."BookingDate" AS "StartDate",
    (b."BookingDate" + (b."Nights" || ' days')::interval) AS "EndDate",
    ARRAY_AGG(d."Name" ORDER BY d."Name") AS "Destinations",
    u."Name" AS "UserName",
    u."Email" AS "UserEmail"
FROM "Bookings" b
JOIN "Users" u ON u."user_id" = b."user_id"
JOIN "BookingDestinations" bd ON bd."booking_id" = b."booking_id"
JOIN "Destinations" d ON d."destination_id" = bd."destination_id"
WHERE b."user_id" = @UserId
GROUP BY b."booking_id", b."TotalPrice", b."Guests", b."Nights", b."BookingDate", u."Name", u."Email"
ORDER BY b."booking_id" DESC;

-- Admin: bookings summary
SELECT
    COUNT(*) AS "TotalBookings",
    COALESCE(SUM(b."TotalPrice"),0) AS "TotalRevenue",
    COALESCE(AVG(b."TotalPrice"),0) AS "AverageBookingValue"
FROM "Bookings" b;

-- Admin: recent bookings with user and destinations (limit 10)
SELECT
    b."booking_id",
    u."Name" AS "UserName",
    u."Email" AS "UserEmail",
    b."TotalPrice",
    b."Guests",
    b."Nights",
    b."BookingDate",
    ARRAY_AGG(d."Name" ORDER BY d."Name") AS "Destinations"
FROM "Bookings" b
JOIN "Users" u ON u."user_id" = b."user_id"
JOIN "BookingDestinations" bd ON bd."booking_id" = b."booking_id"
JOIN "Destinations" d ON d."destination_id" = bd."destination_id"
GROUP BY b."booking_id", u."Name", u."Email", b."TotalPrice", b."Guests", b."Nights", b."BookingDate"
ORDER BY b."BookingDate" DESC
LIMIT 30;
