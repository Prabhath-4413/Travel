using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Travel.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitDatabase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
