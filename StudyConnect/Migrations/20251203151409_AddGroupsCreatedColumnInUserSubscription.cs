using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudyConnect.Migrations
{
    /// <inheritdoc />
    public partial class AddGroupsCreatedColumnInUserSubscription : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "GroupsCreated",
                table: "UserSubscriptions",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GroupsCreated",
                table: "UserSubscriptions");
        }
    }
}
