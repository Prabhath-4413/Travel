using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Travel.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCountryAndCityToDestinations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "destinations",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Country",
                table: "destinations",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "City",
                table: "destinations");

            migrationBuilder.DropColumn(
                name: "Country",
                table: "destinations");
        }
    }
}
