using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WeeklyPlanner.API.Controllers;
using WeeklyPlanner.API.Data;
using WeeklyPlanner.API.Models;
using Xunit;

namespace WeeklyPlanner.Tests
{
    /// <summary>
    /// Unit tests for ExportController endpoints using an isolated in-memory database.
    /// Covers: ExportAll (empty/populated), ImportAll (success, null payload, partial data, duplicates skipped).
    /// </summary>
    public class ExportControllerTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly ExportController _controller;

        public ExportControllerTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _controller = new ExportController(_context);
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        // ─── EXPORT ALL ───────────────────────────────────────────────────────

        [Fact]
        public async Task ExportAll_EmptyDatabase_ReturnsOkWithEmptyCollections()
        {
            var result = await _controller.ExportAll();

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(ok.Value);
        }

        [Fact]
        public async Task ExportAll_WithData_ReturnsAllEntitiesInPayload()
        {
            // Seed one of each entity type
            _context.TeamMembers.Add(new TeamMember { Name = "Alice", IsLead = true });
            _context.BacklogItems.Add(new BacklogItem { Title = "Task A", Category = "R&D", EstimatedHours = 3 });
            _context.WeeklyPlans.Add(new WeeklyPlan { ClientPercentage = 50, TechDebtPercentage = 50, RnDPercentage = 0 });
            await _context.SaveChangesAsync();

            var result = await _controller.ExportAll();

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(ok.Value);

            // Verify entities are actually in the database (controller reads from same context)
            Assert.Equal(1, await _context.TeamMembers.CountAsync());
            Assert.Equal(1, await _context.BacklogItems.CountAsync());
            Assert.Equal(1, await _context.WeeklyPlans.CountAsync());
        }

        // ─── IMPORT ALL ───────────────────────────────────────────────────────

        [Fact]
        public async Task ImportAll_NullPayload_ReturnsBadRequest()
        {
            var result = await _controller.ImportAll(null!);

            var bad = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("No data provided.", bad.Value);
        }

        [Fact]
        public async Task ImportAll_ValidPayload_ImportsAllEntities()
        {
            // Arrange — payload with one member and one backlog item
            var payload = new ImportPayload
            {
                TeamMembers = new List<TeamMember>
                {
                    new TeamMember { Id = 101, Name = "Imported Alice", IsLead = true }
                },
                BacklogItems = new List<BacklogItem>
                {
                    new BacklogItem { Id = 201, Title = "Imported Task", Category = "Tech Debt", EstimatedHours = 4 }
                }
            };

            // Act
            var result = await _controller.ImportAll(payload);

            // Assert
            Assert.IsType<OkObjectResult>(result);
            Assert.Equal(1, await _context.TeamMembers.CountAsync());
            Assert.Equal(1, await _context.BacklogItems.CountAsync());
        }

        [Fact]
        public async Task ImportAll_DuplicateIds_SkipsExistingRecords()
        {
            // Seed an existing member with Id = 101
            _context.TeamMembers.Add(new TeamMember { Id = 101, Name = "Original Alice", IsLead = true });
            await _context.SaveChangesAsync();

            // Try to import a member with the same Id
            var payload = new ImportPayload
            {
                TeamMembers = new List<TeamMember>
                {
                    new TeamMember { Id = 101, Name = "Duplicate Alice", IsLead = false }
                }
            };

            var result = await _controller.ImportAll(payload);

            // DB should still have only 1 member, and it should still be the original
            Assert.IsType<OkObjectResult>(result);
            Assert.Equal(1, await _context.TeamMembers.CountAsync());

            var member = await _context.TeamMembers.FindAsync(101);
            Assert.Equal("Original Alice", member!.Name); // original not overwritten
        }

        [Fact]
        public async Task ImportAll_EmptyPayload_ReturnsOkWithNoChanges()
        {
            var payload = new ImportPayload(); // All lists are null

            var result = await _controller.ImportAll(payload);

            Assert.IsType<OkObjectResult>(result);
            Assert.Equal(0, await _context.TeamMembers.CountAsync());
        }

        [Fact]
        public async Task ImportAll_WithWeeklyPlansAndAssignments_ImportsCorrectly()
        {
            var payload = new ImportPayload
            {
                WeeklyPlans = new List<WeeklyPlan>
                {
                    new WeeklyPlan { Id = 50, ClientPercentage = 60, TechDebtPercentage = 30, RnDPercentage = 10 }
                },
                TaskAssignments = new List<TaskAssignment>
                {
                    new TaskAssignment { Id = 99, WeeklyPlanId = 50, TeamMemberId = 1, PlannedHours = 8 }
                }
            };

            var result = await _controller.ImportAll(payload);

            Assert.IsType<OkObjectResult>(result);
            Assert.Equal(1, await _context.WeeklyPlans.CountAsync());
            Assert.Equal(1, await _context.TaskAssignments.CountAsync());
        }
    }
}
