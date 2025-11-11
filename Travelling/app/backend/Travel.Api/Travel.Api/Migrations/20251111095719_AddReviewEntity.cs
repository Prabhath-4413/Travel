using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Travel.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddReviewEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentDate",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "PaymentId",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "PaymentStatus",
                table: "bookings");

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

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 1,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 9, 57, 18, 800, DateTimeKind.Utc).AddTicks(9487));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 2,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 9, 57, 18, 800, DateTimeKind.Utc).AddTicks(9500));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 3,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 9, 57, 18, 800, DateTimeKind.Utc).AddTicks(9503));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 4,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 9, 57, 18, 800, DateTimeKind.Utc).AddTicks(9507));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 5,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 9, 57, 18, 800, DateTimeKind.Utc).AddTicks(9510));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 6,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 9, 57, 18, 800, DateTimeKind.Utc).AddTicks(9513));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 7,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 9, 57, 18, 800, DateTimeKind.Utc).AddTicks(9515));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 8,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 9, 57, 18, 800, DateTimeKind.Utc).AddTicks(9518));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 9,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 9, 57, 18, 800, DateTimeKind.Utc).AddTicks(9520));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 10,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 9, 57, 18, 800, DateTimeKind.Utc).AddTicks(9522));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 11,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 9, 57, 18, 800, DateTimeKind.Utc).AddTicks(9525));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 12,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 9, 57, 18, 800, DateTimeKind.Utc).AddTicks(9528));

            migrationBuilder.CreateIndex(
                name: "idx_reviews_destination_id",
                table: "reviews",
                column: "destination_id");

            migrationBuilder.CreateIndex(
                name: "idx_reviews_user_id",
                table: "reviews",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "reviews");

            migrationBuilder.AddColumn<DateTime>(
                name: "PaymentDate",
                table: "bookings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentId",
                table: "bookings",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentStatus",
                table: "bookings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 1,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 9, 13, 46, 242, DateTimeKind.Utc).AddTicks(3702));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 2,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 9, 13, 46, 242, DateTimeKind.Utc).AddTicks(3713));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 3,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 9, 13, 46, 242, DateTimeKind.Utc).AddTicks(3715));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 4,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 9, 13, 46, 242, DateTimeKind.Utc).AddTicks(3718));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 5,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 9, 13, 46, 242, DateTimeKind.Utc).AddTicks(3720));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 6,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 9, 13, 46, 242, DateTimeKind.Utc).AddTicks(3722));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 7,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 9, 13, 46, 242, DateTimeKind.Utc).AddTicks(3725));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 8,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 9, 13, 46, 242, DateTimeKind.Utc).AddTicks(3727));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 9,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 9, 13, 46, 242, DateTimeKind.Utc).AddTicks(3730));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 10,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 9, 13, 46, 242, DateTimeKind.Utc).AddTicks(3732));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 11,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 9, 13, 46, 242, DateTimeKind.Utc).AddTicks(3781));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 12,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 9, 13, 46, 242, DateTimeKind.Utc).AddTicks(3785));
        }
    }
}
