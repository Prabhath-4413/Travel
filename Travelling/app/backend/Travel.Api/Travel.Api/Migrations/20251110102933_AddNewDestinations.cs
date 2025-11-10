using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Travel.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddNewDestinations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "travel_package_destinations",
                keyColumns: new[] { "destination_id", "package_id" },
                keyValues: new object[] { 1, 1 });

            migrationBuilder.DeleteData(
                table: "travel_package_destinations",
                keyColumns: new[] { "destination_id", "package_id" },
                keyValues: new object[] { 2, 1 });

            migrationBuilder.DeleteData(
                table: "travel_package_destinations",
                keyColumns: new[] { "destination_id", "package_id" },
                keyValues: new object[] { 3, 2 });

            migrationBuilder.DeleteData(
                table: "travel_package_destinations",
                keyColumns: new[] { "destination_id", "package_id" },
                keyValues: new object[] { 4, 2 });

            migrationBuilder.DeleteData(
                table: "travel_package_destinations",
                keyColumns: new[] { "destination_id", "package_id" },
                keyValues: new object[] { 5, 2 });

            migrationBuilder.DeleteData(
                table: "travel_package_destinations",
                keyColumns: new[] { "destination_id", "package_id" },
                keyValues: new object[] { 2, 3 });

            migrationBuilder.DeleteData(
                table: "travel_package_destinations",
                keyColumns: new[] { "destination_id", "package_id" },
                keyValues: new object[] { 6, 3 });

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 1,
                column: "created_at",
                value: new DateTime(2025, 11, 10, 10, 29, 33, 482, DateTimeKind.Utc).AddTicks(1174));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 2,
                column: "created_at",
                value: new DateTime(2025, 11, 10, 10, 29, 33, 482, DateTimeKind.Utc).AddTicks(1191));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 3,
                column: "created_at",
                value: new DateTime(2025, 11, 10, 10, 29, 33, 482, DateTimeKind.Utc).AddTicks(1195));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 4,
                column: "created_at",
                value: new DateTime(2025, 11, 10, 10, 29, 33, 482, DateTimeKind.Utc).AddTicks(1227));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 5,
                column: "created_at",
                value: new DateTime(2025, 11, 10, 10, 29, 33, 482, DateTimeKind.Utc).AddTicks(1231));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 6,
                column: "created_at",
                value: new DateTime(2025, 11, 10, 10, 29, 33, 482, DateTimeKind.Utc).AddTicks(1233));

            migrationBuilder.InsertData(
                table: "destinations",
                columns: new[] { "destination_id", "city", "country", "created_at", "description", "image_url", "latitude", "longitude", "name", "price" },
                values: new object[,]
                {
                    { 7, "Tokyo", "Japan", new DateTime(2025, 11, 10, 10, 29, 33, 482, DateTimeKind.Utc).AddTicks(1236), "Neon-lit streets, ancient temples, and cutting-edge technology in Japan's capital.", "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200&auto=format&fit=crop", 35.6762m, 139.6503m, "Tokyo Urban Explorer", 65000m },
                    { 8, "Interlaken", "Switzerland", new DateTime(2025, 11, 10, 10, 29, 33, 482, DateTimeKind.Utc).AddTicks(1239), "Snow-capped peaks, crystal-clear lakes, and charming alpine villages.", "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop", 46.8182m, 8.2275m, "Swiss Alps Adventure", 55000m },
                    { 9, "Dubai", "UAE", new DateTime(2025, 11, 10, 10, 29, 33, 482, DateTimeKind.Utc).AddTicks(1245), "Iconic skyscrapers, desert safaris, and world-class shopping in the UAE.", "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop", 25.2048m, 55.2708m, "Dubai Luxury Experience", 58000m },
                    { 10, "Cusco", "Peru", new DateTime(2025, 11, 10, 10, 29, 33, 482, DateTimeKind.Utc).AddTicks(1251), "Ancient Incan citadel, Andean mountains, and mystical cloud forests.", "https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=1200&auto=format&fit=crop", -13.1631m, -72.5450m, "Machu Picchu Trek", 42000m },
                    { 11, "Sydney", "Australia", new DateTime(2025, 11, 10, 10, 29, 33, 482, DateTimeKind.Utc).AddTicks(1253), "Iconic Opera House, Harbour Bridge, and pristine beaches in Australia's harbor city.", "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop", -33.8688m, 151.2093m, "Sydney Harbour Escape", 48000m },
                    { 12, "Reykjavik", "Iceland", new DateTime(2025, 11, 10, 10, 29, 33, 482, DateTimeKind.Utc).AddTicks(1256), "Glaciers, geysers, waterfalls, and the magical aurora borealis.", "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?q=80&w=1200&auto=format&fit=crop", 64.9631m, -19.0208m, "Iceland Northern Lights", 62000m }
                });

            migrationBuilder.InsertData(
                table: "travel_packages",
                columns: new[] { "package_id", "created_at", "description", "image_url", "name", "price" },
                values: new object[,]
                {
                    { 4, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Modern city vibes with cutting-edge technology, vibrant nightlife, and cultural landmarks.", "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200&auto=format&fit=crop", "Urban Explorer", 799.99m },
                    { 5, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Premium destinations featuring world-class accommodations, exclusive experiences, and personalized service.", "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop", "Luxury Worldwide", 1499.99m },
                    { 6, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Thrilling outdoor activities, breathtaking landscapes, and unforgettable natural wonders.", "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop", "Adventure Seeker", 1099.99m },
                    { 7, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Rich history, architectural marvels, and culinary traditions across Europe's most iconic cities.", "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop", "European Heritage Tour", 1199.99m }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "travel_packages",
                keyColumn: "package_id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "travel_packages",
                keyColumn: "package_id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "travel_packages",
                keyColumn: "package_id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "travel_packages",
                keyColumn: "package_id",
                keyValue: 7);

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 1,
                column: "created_at",
                value: new DateTime(2025, 11, 10, 10, 3, 58, 92, DateTimeKind.Utc).AddTicks(7106));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 2,
                column: "created_at",
                value: new DateTime(2025, 11, 10, 10, 3, 58, 92, DateTimeKind.Utc).AddTicks(7121));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 3,
                column: "created_at",
                value: new DateTime(2025, 11, 10, 10, 3, 58, 92, DateTimeKind.Utc).AddTicks(7123));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 4,
                column: "created_at",
                value: new DateTime(2025, 11, 10, 10, 3, 58, 92, DateTimeKind.Utc).AddTicks(7126));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 5,
                column: "created_at",
                value: new DateTime(2025, 11, 10, 10, 3, 58, 92, DateTimeKind.Utc).AddTicks(7128));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 6,
                column: "created_at",
                value: new DateTime(2025, 11, 10, 10, 3, 58, 92, DateTimeKind.Utc).AddTicks(7131));

            migrationBuilder.InsertData(
                table: "travel_package_destinations",
                columns: new[] { "destination_id", "package_id" },
                values: new object[,]
                {
                    { 1, 1 },
                    { 2, 1 },
                    { 3, 2 },
                    { 4, 2 },
                    { 5, 2 },
                    { 2, 3 },
                    { 6, 3 }
                });
        }
    }
}
