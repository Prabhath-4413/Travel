using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Travel.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRatingAndReviewToBookings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Status",
                table: "bookings",
                newName: "status");

            migrationBuilder.AlterColumn<int>(
                name: "status",
                table: "bookings",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "rating",
                table: "bookings",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "review",
                table: "bookings",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "rating",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "review",
                table: "bookings");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "bookings",
                newName: "Status");

            migrationBuilder.AlterColumn<int>(
                name: "Status",
                table: "bookings",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 0);
        }
    }
}
