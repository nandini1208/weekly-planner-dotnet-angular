using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeeklyPlanner.API.Migrations
{
    /// <inheritdoc />
    public partial class AddDescriptionToBacklogItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "BacklogItems",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "BacklogItems");
        }
    }
}
