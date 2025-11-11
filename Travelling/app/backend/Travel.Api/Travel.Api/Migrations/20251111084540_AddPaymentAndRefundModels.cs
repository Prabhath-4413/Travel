using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Travel.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentAndRefundModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 1,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 8, 45, 39, 581, DateTimeKind.Utc).AddTicks(9210));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 2,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 8, 45, 39, 581, DateTimeKind.Utc).AddTicks(9225));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 3,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 8, 45, 39, 581, DateTimeKind.Utc).AddTicks(9228));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 4,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 8, 45, 39, 581, DateTimeKind.Utc).AddTicks(9230));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 5,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 8, 45, 39, 581, DateTimeKind.Utc).AddTicks(9233));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 6,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 8, 45, 39, 581, DateTimeKind.Utc).AddTicks(9264));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 7,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 8, 45, 39, 581, DateTimeKind.Utc).AddTicks(9267));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 8,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 8, 45, 39, 581, DateTimeKind.Utc).AddTicks(9270));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 9,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 8, 45, 39, 581, DateTimeKind.Utc).AddTicks(9272));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 10,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 8, 45, 39, 581, DateTimeKind.Utc).AddTicks(9274));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 11,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 8, 45, 39, 581, DateTimeKind.Utc).AddTicks(9277));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 12,
                column: "created_at",
                value: new DateTime(2025, 11, 11, 8, 45, 39, 581, DateTimeKind.Utc).AddTicks(9279));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 7,
                column: "created_at",
                value: new DateTime(2025, 11, 10, 10, 29, 33, 482, DateTimeKind.Utc).AddTicks(1236));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 8,
                column: "created_at",
                value: new DateTime(2025, 11, 10, 10, 29, 33, 482, DateTimeKind.Utc).AddTicks(1239));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 9,
                column: "created_at",
                value: new DateTime(2025, 11, 10, 10, 29, 33, 482, DateTimeKind.Utc).AddTicks(1245));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 10,
                column: "created_at",
                value: new DateTime(2025, 11, 10, 10, 29, 33, 482, DateTimeKind.Utc).AddTicks(1251));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 11,
                column: "created_at",
                value: new DateTime(2025, 11, 10, 10, 29, 33, 482, DateTimeKind.Utc).AddTicks(1253));

            migrationBuilder.UpdateData(
                table: "destinations",
                keyColumn: "destination_id",
                keyValue: 12,
                column: "created_at",
                value: new DateTime(2025, 11, 10, 10, 29, 33, 482, DateTimeKind.Utc).AddTicks(1256));
        }
    }
}
