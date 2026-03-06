using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeeklyPlanner.API.Migrations
{
    /// <inheritdoc />
    public partial class AddIsCompletedToWeeklyPlan : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsCompleted",
                table: "WeeklyPlans",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_TaskAssignments_BacklogItemId",
                table: "TaskAssignments",
                column: "BacklogItemId");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskAssignments_BacklogItems_BacklogItemId",
                table: "TaskAssignments",
                column: "BacklogItemId",
                principalTable: "BacklogItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskAssignments_BacklogItems_BacklogItemId",
                table: "TaskAssignments");

            migrationBuilder.DropIndex(
                name: "IX_TaskAssignments_BacklogItemId",
                table: "TaskAssignments");

            migrationBuilder.DropColumn(
                name: "IsCompleted",
                table: "WeeklyPlans");
        }
    }
}
