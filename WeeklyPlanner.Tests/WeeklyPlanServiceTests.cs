using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using WeeklyPlanner.API.Data;
using WeeklyPlanner.API.Models;
using WeeklyPlanner.API.Services;
using Xunit;
using Moq;

namespace WeeklyPlanner.Tests
{
    public class WeeklyPlanServiceTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly Mock<IDateTimeProvider> _dateTimeMock;
        private readonly WeeklyPlanService _service;
        private readonly DateTime _tuesday = new DateTime(2026, 3, 10); // A Tuesday

        public WeeklyPlanServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _dateTimeMock = new Mock<IDateTimeProvider>();
            _dateTimeMock.Setup(m => m.UtcNow).Returns(_tuesday);
            
            _service = new WeeklyPlanService(_context, _dateTimeMock.Object);
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        [Fact]
        public async Task CreatePlanAsync_ValidPercentages_CreatesPlan()
        {
            var plan = new WeeklyPlan { StartDate = new DateTime(2026, 3, 10), ClientPercentage = 60, TechDebtPercentage = 30, RnDPercentage = 10 }; // Tuesday
            var result = await _service.CreatePlanAsync(plan);
            Assert.NotNull(result);
            Assert.Equal(100, result.ClientPercentage + result.TechDebtPercentage + result.RnDPercentage);
        }

        [Fact]
        public async Task CreatePlanAsync_NotTuesday_ThrowsArgumentException()
        {
            var plan = new WeeklyPlan { StartDate = new DateTime(2026, 3, 9), ClientPercentage = 60, TechDebtPercentage = 30, RnDPercentage = 10 }; // Monday
            await Assert.ThrowsAsync<ArgumentException>(() => _service.CreatePlanAsync(plan));
        }

        [Fact]
        public async Task CreatePlanAsync_InvalidPercentages_ThrowsArgumentException()
        {
            var plan = new WeeklyPlan { ClientPercentage = 50, TechDebtPercentage = 30, RnDPercentage = 10 };
            await Assert.ThrowsAsync<ArgumentException>(() => _service.CreatePlanAsync(plan));
        }

        [Fact]
        public async Task FreezePlan_ValidId_FreezesPlan()
        {
            var plan = new WeeklyPlan { ClientPercentage = 50, TechDebtPercentage = 50, RnDPercentage = 0 };
            _context.WeeklyPlans.Add(plan);
            await _context.SaveChangesAsync();

            var result = await _service.FreezePlanAsync(plan.Id);
            Assert.True(result.IsFrozen);
        }

        [Fact]
        public async Task FreezePlan_InvalidId_ThrowsKeyNotFoundException()
        {
            await Assert.ThrowsAsync<System.Collections.Generic.KeyNotFoundException>(() => _service.FreezePlanAsync(999));
        }

        [Fact]
        public async Task AddAssignmentAsync_FrozenPlan_ThrowsInvalidOperationException()
        {
            var plan = new WeeklyPlan { ClientPercentage = 50, TechDebtPercentage = 50, RnDPercentage = 0, IsFrozen = true };
            _context.WeeklyPlans.Add(plan);
            await _context.SaveChangesAsync();

            var assignment = new TaskAssignment { WeeklyPlanId = plan.Id, PlannedHours = 10 };
            await Assert.ThrowsAsync<InvalidOperationException>(() => _service.AddAssignmentAsync(assignment));
        }

        [Fact]
        public async Task AddAssignmentAsync_InvalidPlan_ThrowsKeyNotFoundException()
        {
            var assignment = new TaskAssignment { WeeklyPlanId = 999, PlannedHours = 10 };
            await Assert.ThrowsAsync<System.Collections.Generic.KeyNotFoundException>(() => _service.AddAssignmentAsync(assignment));
        }

        [Fact]
        public async Task AddAssignmentAsync_Exceeds30Hours_ThrowsInvalidOperationException()
        {
            var plan = new WeeklyPlan { ClientPercentage = 50, TechDebtPercentage = 50, RnDPercentage = 0 };
            _context.WeeklyPlans.Add(plan);
            await _context.SaveChangesAsync();

            // Seed 25 existing hours. Adding 10 more = 35h total which exceeds the 30h strict cap.
            var existingAssignment = new TaskAssignment { WeeklyPlanId = plan.Id, TeamMemberId = 1, PlannedHours = 25 };
            _context.TaskAssignments.Add(existingAssignment);
            await _context.SaveChangesAsync();

            var newAssignment = new TaskAssignment { WeeklyPlanId = plan.Id, TeamMemberId = 1, PlannedHours = 10 };
            await Assert.ThrowsAsync<InvalidOperationException>(() => _service.AddAssignmentAsync(newAssignment));
        }

        [Fact]
        public async Task AddAssignmentAsync_ValidAssignment_CreatesProgressUpdate()
        {
            var plan = new WeeklyPlan { ClientPercentage = 50, TechDebtPercentage = 50, RnDPercentage = 0 };
            _context.WeeklyPlans.Add(plan);
            await _context.SaveChangesAsync();

            var assignment = new TaskAssignment { WeeklyPlanId = plan.Id, TeamMemberId = 1, PlannedHours = 10 };
            var result = await _service.AddAssignmentAsync(assignment);

            var update = await _context.ProgressUpdates.FirstOrDefaultAsync(u => u.TaskAssignmentId == result.Id);
            Assert.NotNull(update);
            Assert.Equal("To Do", update.Status);
        }

        [Fact]
        public async Task UpdateProgressAsync_ValidUpdate_UpdatesBacklogStatus()
        {
            var backlogItem = new BacklogItem { Title = "Test Task", Category = "Client", Status = "To Do" };
            _context.BacklogItems.Add(backlogItem);
            await _context.SaveChangesAsync();

            var assignment = new TaskAssignment { BacklogItemId = backlogItem.Id };
            _context.TaskAssignments.Add(assignment);
            await _context.SaveChangesAsync();

            var update = await _service.UpdateProgressAsync(assignment.Id, 5, "In Progress");

            var updatedBacklogItem = await _context.BacklogItems.FindAsync(backlogItem.Id);
            Assert.NotNull(update);
            Assert.NotNull(updatedBacklogItem);
            Assert.Equal("In Progress", update.Status);
            Assert.Equal("In Progress", updatedBacklogItem.Status);
        }
    }
}
