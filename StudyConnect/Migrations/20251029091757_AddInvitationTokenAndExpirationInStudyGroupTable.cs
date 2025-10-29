using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudyConnect.Migrations
{
    /// <inheritdoc />
    public partial class AddInvitationTokenAndExpirationInStudyGroupTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "InviteToken",
                table: "StudyGroups",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "InviteTokenExpiration",
                table: "StudyGroups",
                type: "datetime(6)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InviteToken",
                table: "StudyGroups");

            migrationBuilder.DropColumn(
                name: "InviteTokenExpiration",
                table: "StudyGroups");
        }
    }
}
