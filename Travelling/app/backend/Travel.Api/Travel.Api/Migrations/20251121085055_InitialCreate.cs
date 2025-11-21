using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Travel.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "destinations",
                columns: table => new
                {
                    destination_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    price = table.Column<decimal>(type: "numeric(10,2)", nullable: false, defaultValue: 0m),
                    image_url = table.Column<string>(type: "text", nullable: true),
                    latitude = table.Column<decimal>(type: "numeric(9,6)", nullable: true),
                    longitude = table.Column<decimal>(type: "numeric(9,6)", nullable: true),
                    country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    city = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_destinations", x => x.destination_id);
                });

            migrationBuilder.CreateTable(
                name: "feedbacks",
                columns: table => new
                {
                    feedback_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    message = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    rating = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_feedbacks", x => x.feedback_id);
                });

            migrationBuilder.CreateTable(
                name: "travel_packages",
                columns: table => new
                {
                    package_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    price = table.Column<decimal>(type: "numeric(10,2)", nullable: false, defaultValue: 0m),
                    image_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_travel_packages", x => x.package_id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    user_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false, defaultValue: ""),
                    email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    password = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    role = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "user"),
                    GoogleId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Picture = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.user_id);
                });

            migrationBuilder.CreateTable(
                name: "travel_package_destinations",
                columns: table => new
                {
                    package_id = table.Column<int>(type: "integer", nullable: false),
                    destination_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_travel_package_destinations", x => new { x.package_id, x.destination_id });
                    table.ForeignKey(
                        name: "FK_travel_package_destinations_destinations_destination_id",
                        column: x => x.destination_id,
                        principalTable: "destinations",
                        principalColumn: "destination_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_travel_package_destinations_travel_packages_package_id",
                        column: x => x.package_id,
                        principalTable: "travel_packages",
                        principalColumn: "package_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "bookings",
                columns: table => new
                {
                    booking_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    total_price = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    guests = table.Column<int>(type: "integer", nullable: false),
                    nights = table.Column<int>(type: "integer", nullable: false),
                    booking_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    confirmed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    reminder_sent = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    status = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    cancellation_status = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    rating = table.Column<int>(type: "integer", nullable: true),
                    review = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bookings", x => x.booking_id);
                    table.ForeignKey(
                        name: "FK_bookings_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "reviews",
                columns: table => new
                {
                    review_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    destination_id = table.Column<int>(type: "integer", nullable: false),
                    rating = table.Column<int>(type: "integer", nullable: false),
                    comment = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reviews", x => x.review_id);
                    table.ForeignKey(
                        name: "FK_reviews_destinations_destination_id",
                        column: x => x.destination_id,
                        principalTable: "destinations",
                        principalColumn: "destination_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_reviews_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "booking_destinations",
                columns: table => new
                {
                    booking_id = table.Column<int>(type: "integer", nullable: false),
                    destination_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_booking_destinations", x => new { x.booking_id, x.destination_id });
                    table.ForeignKey(
                        name: "FK_booking_destinations_bookings_booking_id",
                        column: x => x.booking_id,
                        principalTable: "bookings",
                        principalColumn: "booking_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_booking_destinations_destinations_destination_id",
                        column: x => x.destination_id,
                        principalTable: "destinations",
                        principalColumn: "destination_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "booking_otps",
                columns: table => new
                {
                    booking_otp_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    booking_id = table.Column<int>(type: "integer", nullable: false),
                    otp = table.Column<string>(type: "character varying(6)", maxLength: 6, nullable: false),
                    expiry = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    used = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_booking_otps", x => x.booking_otp_id);
                    table.ForeignKey(
                        name: "FK_booking_otps_bookings_booking_id",
                        column: x => x.booking_id,
                        principalTable: "bookings",
                        principalColumn: "booking_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "trip_cancellations",
                columns: table => new
                {
                    trip_cancellation_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    booking_id = table.Column<int>(type: "integer", nullable: false),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    requested_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    reviewed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    admin_comment = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_trip_cancellations", x => x.trip_cancellation_id);
                    table.ForeignKey(
                        name: "FK_trip_cancellations_bookings_booking_id",
                        column: x => x.booking_id,
                        principalTable: "bookings",
                        principalColumn: "booking_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_trip_cancellations_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "destinations",
                columns: new[] { "destination_id", "city", "country", "created_at", "description", "image_url", "latitude", "longitude", "name", "price" },
                values: new object[,]
                {
                    { 1, "Goa", "India", new DateTime(2025, 11, 21, 8, 50, 55, 188, DateTimeKind.Utc).AddTicks(7531), "Golden beaches, vibrant shacks, and Portuguese heritage for a sun-soaked getaway.", "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200&auto=format&fit=crop", 15.2993m, 74.1240m, "Goa Coastline Escape", 5200m },
                    { 2, "Munnar", "India", new DateTime(2025, 11, 21, 8, 50, 55, 188, DateTimeKind.Utc).AddTicks(7542), "Mist-covered mountains, endless tea gardens, and cool breezes in Kerala's hill country.", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80", 10.0889m, 77.0595m, "Munnar Tea Highlands", 4000m },
                    { 3, "Jaipur", "India", new DateTime(2025, 11, 21, 8, 50, 55, 188, DateTimeKind.Utc).AddTicks(7545), "The Pink City's palaces, royal bazaars, and forts wrapped in Rajasthan heritage.", "https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=1200&auto=format&fit=crop", 26.9124m, 75.7873m, "Jaipur Royal Circuit", 4800m },
                    { 4, "Bali", "Indonesia", new DateTime(2025, 11, 21, 8, 50, 55, 188, DateTimeKind.Utc).AddTicks(7549), "Balinese temples, terraced rice fields, and sunset beaches for an island escape.", "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1200&auto=format&fit=crop", -8.3405m, 115.0920m, "Bali Island Retreat", 18500m },
                    { 5, "Paris", "France", new DateTime(2025, 11, 21, 8, 50, 55, 188, DateTimeKind.Utc).AddTicks(7551), "Iconic boulevards, cafés, and museums in the heart of the City of Light.", "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop", 48.8566m, 2.3522m, "Paris City Lights", 45000m },
                    { 6, "Santorini", "Greece", new DateTime(2025, 11, 21, 8, 50, 55, 188, DateTimeKind.Utc).AddTicks(7555), "Blue-domed churches, whitewashed cliffs, and legendary caldera sunsets.", "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?q=80&w=1200&auto=format&fit=crop", 36.3932m, 25.4615m, "Santorini Sunset Escape", 52000m },
                    { 7, "Tokyo", "Japan", new DateTime(2025, 11, 21, 8, 50, 55, 188, DateTimeKind.Utc).AddTicks(7557), "Neon-lit streets, ancient temples, and cutting-edge technology in Japan's capital.", "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200&auto=format&fit=crop", 35.6762m, 139.6503m, "Tokyo Urban Explorer", 65000m },
                    { 8, "Interlaken", "Switzerland", new DateTime(2025, 11, 21, 8, 50, 55, 188, DateTimeKind.Utc).AddTicks(7559), "Snow-capped peaks, crystal-clear lakes, and charming alpine villages.", "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop", 46.8182m, 8.2275m, "Swiss Alps Adventure", 55000m },
                    { 9, "Dubai", "UAE", new DateTime(2025, 11, 21, 8, 50, 55, 188, DateTimeKind.Utc).AddTicks(7561), "Iconic skyscrapers, desert safaris, and world-class shopping in the UAE.", "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop", 25.2048m, 55.2708m, "Dubai Luxury Experience", 58000m },
                    { 10, "Cusco", "Peru", new DateTime(2025, 11, 21, 8, 50, 55, 188, DateTimeKind.Utc).AddTicks(7563), "Ancient Incan citadel, Andean mountains, and mystical cloud forests.", "https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=1200&auto=format&fit=crop", -13.1631m, -72.5450m, "Machu Picchu Trek", 42000m },
                    { 11, "Sydney", "Australia", new DateTime(2025, 11, 21, 8, 50, 55, 188, DateTimeKind.Utc).AddTicks(7566), "Iconic Opera House, Harbour Bridge, and pristine beaches in Australia's harbor city.", "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop", -33.8688m, 151.2093m, "Sydney Harbour Escape", 48000m },
                    { 12, "Reykjavik", "Iceland", new DateTime(2025, 11, 21, 8, 50, 55, 188, DateTimeKind.Utc).AddTicks(7568), "Glaciers, geysers, waterfalls, and the magical aurora borealis.", "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?q=80&w=1200&auto=format&fit=crop", 64.9631m, -19.0208m, "Iceland Northern Lights", 62000m }
                });

            migrationBuilder.InsertData(
                table: "travel_packages",
                columns: new[] { "package_id", "created_at", "description", "image_url", "name", "price" },
                values: new object[,]
                {
                    { 1, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Five-day coastal escape featuring sunrise yoga, local seafood tastings, and resort-style beach villas.", "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80", "Beach Escape", 499.99m },
                    { 2, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Week-long alpine expedition with guided summit treks, riverside camping, and stargazing under clear skies.", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80", "Mountain Adventure", 899.99m },
                    { 3, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Curated heritage trail showcasing palace walkthroughs, artisan workshops, and immersive food tours.", "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80", "Cultural Journey", 699.99m },
                    { 4, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Modern city vibes with cutting-edge technology, vibrant nightlife, and cultural landmarks.", "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200&auto=format&fit=crop", "Urban Explorer", 799.99m },
                    { 5, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Premium destinations featuring world-class accommodations, exclusive experiences, and personalized service.", "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop", "Luxury Worldwide", 1499.99m },
                    { 6, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Thrilling outdoor activities, breathtaking landscapes, and unforgettable natural wonders.", "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop", "Adventure Seeker", 1099.99m },
                    { 7, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Rich history, architectural marvels, and culinary traditions across Europe's most iconic cities.", "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop", "European Heritage Tour", 1199.99m }
                });

            migrationBuilder.CreateIndex(
                name: "idx_bookingdest_dest_id",
                table: "booking_destinations",
                column: "destination_id");

            migrationBuilder.CreateIndex(
                name: "idx_booking_otps_booking_id",
                table: "booking_otps",
                column: "booking_id");

            migrationBuilder.CreateIndex(
                name: "idx_booking_otps_email",
                table: "booking_otps",
                column: "email");

            migrationBuilder.CreateIndex(
                name: "idx_bookings_user_id",
                table: "bookings",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_destinations_name",
                table: "destinations",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_feedbacks_created_at",
                table: "feedbacks",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "idx_reviews_destination_id",
                table: "reviews",
                column: "destination_id");

            migrationBuilder.CreateIndex(
                name: "idx_reviews_user_id",
                table: "reviews",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_travel_package_destinations_destination_id",
                table: "travel_package_destinations",
                column: "destination_id");

            migrationBuilder.CreateIndex(
                name: "idx_tripcancellations_booking_id",
                table: "trip_cancellations",
                column: "booking_id");

            migrationBuilder.CreateIndex(
                name: "idx_tripcancellations_user_id",
                table: "trip_cancellations",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_users_email",
                table: "users",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "booking_destinations");

            migrationBuilder.DropTable(
                name: "booking_otps");

            migrationBuilder.DropTable(
                name: "feedbacks");

            migrationBuilder.DropTable(
                name: "reviews");

            migrationBuilder.DropTable(
                name: "travel_package_destinations");

            migrationBuilder.DropTable(
                name: "trip_cancellations");

            migrationBuilder.DropTable(
                name: "destinations");

            migrationBuilder.DropTable(
                name: "travel_packages");

            migrationBuilder.DropTable(
                name: "bookings");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
