using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Travel.Api.Migrations
{
    /// <inheritdoc />
    public partial class SeedTravelPackages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "travel_packages",
                columns: new[] { "package_id", "created_at", "description", "image_url", "name", "price" },
                values: new object[,]
                {
                    { 1, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Relax on stunning beaches and enjoy ocean views.", "https://example.com/images/beach_escape.jpg", "Beach Escape", 499.99m },
                    { 2, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Hike across breathtaking mountain trails and valleys.", "https://example.com/images/mountain_adventure.jpg", "Mountain Adventure", 899.99m },
                    { 3, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Explore heritage sites and local traditions.", "https://example.com/images/cultural_journey.jpg", "Cultural Journey", 699.99m }
                });

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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

            migrationBuilder.DeleteData(
                table: "travel_packages",
                keyColumn: "package_id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "travel_packages",
                keyColumn: "package_id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "travel_packages",
                keyColumn: "package_id",
                keyValue: 3);
        }
    }
}
