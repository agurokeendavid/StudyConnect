using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudyConnect.Migrations
{
    /// <inheritdoc />
    public partial class AddMeetingStatusTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ActualEndTime",
                table: "StudyGroupMeetings",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ActualStartTime",
                table: "StudyGroupMeetings",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AttendanceCount",
                table: "StudyGroupMeetings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsPostponed",
                table: "StudyGroupMeetings",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MeetingNotes",
                table: "StudyGroupMeetings",
                type: "varchar(2000)",
                maxLength: 2000,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "MeetingStatus",
                table: "StudyGroupMeetings",
                type: "varchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "NoShowNotes",
                table: "StudyGroupMeetings",
                type: "varchar(1000)",
                maxLength: 1000,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<bool>(
                name: "NoShowRecorded",
                table: "StudyGroupMeetings",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "PostponedToDate",
                table: "StudyGroupMeetings",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PostponementReason",
                table: "StudyGroupMeetings",
                type: "varchar(1000)",
                maxLength: 1000,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActualEndTime",
                table: "StudyGroupMeetings");

            migrationBuilder.DropColumn(
                name: "ActualStartTime",
                table: "StudyGroupMeetings");

            migrationBuilder.DropColumn(
                name: "AttendanceCount",
                table: "StudyGroupMeetings");

            migrationBuilder.DropColumn(
                name: "IsPostponed",
                table: "StudyGroupMeetings");

            migrationBuilder.DropColumn(
                name: "MeetingNotes",
                table: "StudyGroupMeetings");

            migrationBuilder.DropColumn(
                name: "MeetingStatus",
                table: "StudyGroupMeetings");

            migrationBuilder.DropColumn(
                name: "NoShowNotes",
                table: "StudyGroupMeetings");

            migrationBuilder.DropColumn(
                name: "NoShowRecorded",
                table: "StudyGroupMeetings");

            migrationBuilder.DropColumn(
                name: "PostponedToDate",
                table: "StudyGroupMeetings");

            migrationBuilder.DropColumn(
                name: "PostponementReason",
                table: "StudyGroupMeetings");
        }
    }
}
