using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Travel.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDestinationSeeding : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Country",
                table: "destinations",
                newName: "country");

            migrationBuilder.RenameColumn(
                name: "City",
                table: "destinations",
                newName: "city");

            migrationBuilder.AddColumn<string>(
                name: "GoogleId",
                table: "users",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Picture",
                table: "users",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.InsertData(
                table: "destinations",
                columns: new[] { "destination_id", "city", "country", "created_at", "description", "image_url", "latitude", "longitude", "name", "price" },
                values: new object[,]
                {
                    { 1, "Goa", "India", new DateTime(2025, 11, 10, 10, 3, 58, 92, DateTimeKind.Utc).AddTicks(7106), "Golden beaches, vibrant shacks, and Portuguese heritage for a sun-soaked getaway.", "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200&auto=format&fit=crop", 15.2993m, 74.1240m, "Goa Coastline Escape", 5200m },
                    { 2, "Munnar", "India", new DateTime(2025, 11, 10, 10, 3, 58, 92, DateTimeKind.Utc).AddTicks(7121), "Mist-covered mountains, endless tea gardens, and cool breezes in Kerala's hill country.", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80", 10.0889m, 77.0595m, "Munnar Tea Highlands", 4000m },
                    { 3, "Jaipur", "India", new DateTime(2025, 11, 10, 10, 3, 58, 92, DateTimeKind.Utc).AddTicks(7123), "The Pink City's palaces, royal bazaars, and forts wrapped in Rajasthan heritage.", "https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=1200&auto=format&fit=crop", 26.9124m, 75.7873m, "Jaipur Royal Circuit", 4800m },
                    { 4, "Bali", "Indonesia", new DateTime(2025, 11, 10, 10, 3, 58, 92, DateTimeKind.Utc).AddTicks(7126), "Balinese temples, terraced rice fields, and sunset beaches for an island escape.", "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1200&auto=format&fit=crop", -8.3405m, 115.0920m, "Bali Island Retreat", 18500m },
                    { 5, "Paris", "France", new DateTime(2025, 11, 10, 10, 3, 58, 92, DateTimeKind.Utc).AddTicks(7128), "Iconic boulevards, cafés, and museums in the heart of the City of Light.", "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop", 48.8566m, 2.3522m, "Paris City Lights", 45000m },
                    { 6, "Santorini", "Greece", new DateTime(2025, 11, 10, 10, 3, 58, 92, DateTimeKind.Utc).AddTicks(7131), "Blue-domed churches, whitewashed cliffs, and legendary caldera sunsets.", "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?q=80&w=1200&auto=format&fit=crop", 36.3932m, 25.4615m, "Santorini Sunset Escape", 52000m }
                });

            migrationBuilder.UpdateData(
                table: "travel_packages",
                keyColumn: "package_id",
                keyValue: 1,
                columns: new[] { "description", "image_url" },
                values: new object[] { "Five-day coastal escape featuring sunrise yoga, local seafood tastings, and resort-style beach villas.", "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80" });

            migrationBuilder.UpdateData(
                table: "travel_packages",
                keyColumn: "package_id",
                keyValue: 2,
                columns: new[] { "description", "image_url" },
                values: new object[] { "Week-long alpine expedition with guided summit treks, riverside camping, and stargazing under clear skies.", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80" });

            migrationBuilder.UpdateData(
                table: "travel_packages",
                keyColumn: "package_id",
                keyValue: 3,
                columns: new[] { "description", "image_url" },
                values: new object[] { "Curated heritage trail showcasing palace walkthroughs, artisan workshops, and immersive food tours.", "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 6);

            migrationBuilder.DropColumn(
                name: "GoogleId",
                table: "users");

            migrationBuilder.DropColumn(
                name: "Picture",
                table: "users");

            migrationBuilder.RenameColumn(
                name: "country",
                table: "destinations",
                newName: "Country");

            migrationBuilder.RenameColumn(
                name: "city",
                table: "destinations",
                newName: "City");

            migrationBuilder.UpdateData(
                table: "travel_packages",
                keyColumn: "package_id",
                keyValue: 1,
                columns: new[] { "description", "image_url" },
                values: new object[] { "Relax on stunning beaches and enjoy ocean views.", "https://example.com/images/beach_escape.jpg" });

            migrationBuilder.UpdateData(
                table: "travel_packages",
                keyColumn: "package_id",
                keyValue: 2,
                columns: new[] { "description", "image_url" },
                values: new object[] { "Hike across breathtaking mountain trails and valleys.", "https://example.com/images/mountain_adventure.jpg" });

            migrationBuilder.UpdateData(
                table: "travel_packages",
                keyColumn: "package_id",
                keyValue: 3,
                columns: new[] { "description", "image_url" },
                values: new object[] { "Explore heritage sites and local traditions.", "https://example.com/images/cultural_journey.jpg" });
        }
    }
}
