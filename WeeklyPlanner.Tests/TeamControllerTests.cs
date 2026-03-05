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
    /// Unit tests for TeamController endpoints using an isolated in-memory database.
    /// Covers: GetTeamMembers, PostTeamMember, MakeLead, UpdateTeamMember, DeleteTeamMember, ClearAllTeamMembers.
    /// </summary>
    public class TeamControllerTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly TeamController _controller;

        public TeamControllerTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _controller = new TeamController(_context);
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        // ─── GET ──────────────────────────────────────────────────────────────

        [Fact]
        public async Task GetTeamMembers_EmptyDb_ReturnsEmptyList()
        {
            var result = await _controller.GetTeamMembers();

            var ok = Assert.IsType<ActionResult<IEnumerable<TeamMember>>>(result);
            var members = Assert.IsAssignableFrom<IEnumerable<TeamMember>>(ok.Value);
            Assert.Empty(members);
        }

        [Fact]
        public async Task GetTeamMembers_WithMembers_ReturnsAllMembers()
        {
            _context.TeamMembers.AddRange(
                new TeamMember { Name = "Alice", IsLead = true },
                new TeamMember { Name = "Bob", IsLead = false }
            );
            await _context.SaveChangesAsync();

            var result = await _controller.GetTeamMembers();

            var members = Assert.IsAssignableFrom<IEnumerable<TeamMember>>(result.Value);
            Assert.Equal(2, members.Count());
        }

        // ─── POST ─────────────────────────────────────────────────────────────

        [Fact]
        public async Task PostTeamMember_ValidMember_ReturnsCreated()
        {
            var member = new TeamMember { Name = "Charlie", IsLead = false };

            var result = await _controller.PostTeamMember(member);

            var created = Assert.IsType<CreatedAtActionResult>(result.Result);
            var returnedMember = Assert.IsType<TeamMember>(created.Value);
            Assert.Equal("Charlie", returnedMember.Name);
        }

        [Fact]
        public async Task PostTeamMember_ValidMember_PersistsToDatabase()
        {
            var member = new TeamMember { Name = "Dana", IsLead = false };

            await _controller.PostTeamMember(member);

            Assert.Equal(1, await _context.TeamMembers.CountAsync());
            Assert.Equal("Dana", (await _context.TeamMembers.FirstAsync()).Name);
        }

        // ─── MAKE LEAD ────────────────────────────────────────────────────────

        [Fact]
        public async Task MakeLead_ValidId_PromotesMemberAndDemotesOthers()
        {
            // Arrange — seed Alice as current lead, Bob as regular
            var alice = new TeamMember { Name = "Alice", IsLead = true };
            var bob   = new TeamMember { Name = "Bob",   IsLead = false };
            _context.TeamMembers.AddRange(alice, bob);
            await _context.SaveChangesAsync();

            // Act — promote Bob to lead
            var result = await _controller.MakeLead(bob.Id);

            // Assert
            Assert.IsType<NoContentResult>(result);

            var updatedAlice = await _context.TeamMembers.FindAsync(alice.Id);
            var updatedBob   = await _context.TeamMembers.FindAsync(bob.Id);
            Assert.False(updatedAlice!.IsLead, "Alice should no longer be lead");
            Assert.True(updatedBob!.IsLead,    "Bob should now be the lead");
        }

        [Fact]
        public async Task MakeLead_InvalidId_ReturnsNotFound()
        {
            var result = await _controller.MakeLead(999);

            Assert.IsType<NotFoundResult>(result);
        }

        // ─── UPDATE NAME ──────────────────────────────────────────────────────

        [Fact]
        public async Task UpdateTeamMember_ValidId_UpdatesName()
        {
            var member = new TeamMember { Name = "Old Name", IsLead = false };
            _context.TeamMembers.Add(member);
            await _context.SaveChangesAsync();

            var updated = new TeamMember { Id = member.Id, Name = "New Name", IsLead = false };
            var result = await _controller.UpdateTeamMember(member.Id, updated);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var saved = Assert.IsType<TeamMember>(ok.Value);
            Assert.Equal("New Name", saved.Name);
        }

        [Fact]
        public async Task UpdateTeamMember_InvalidId_ReturnsNotFound()
        {
            var updated = new TeamMember { Id = 999, Name = "Ghost", IsLead = false };
            var result = await _controller.UpdateTeamMember(999, updated);

            Assert.IsType<NotFoundResult>(result.Result);
        }

        // ─── DELETE ───────────────────────────────────────────────────────────

        [Fact]
        public async Task DeleteTeamMember_ValidId_RemovesMember()
        {
            var member = new TeamMember { Name = "ToDelete", IsLead = false };
            _context.TeamMembers.Add(member);
            await _context.SaveChangesAsync();

            var result = await _controller.DeleteTeamMember(member.Id);

            Assert.IsType<NoContentResult>(result);
            Assert.Equal(0, await _context.TeamMembers.CountAsync());
        }

        [Fact]
        public async Task DeleteTeamMember_InvalidId_ReturnsNotFound()
        {
            var result = await _controller.DeleteTeamMember(999);

            Assert.IsType<NotFoundResult>(result);
        }

        // ─── CLEAR ALL ────────────────────────────────────────────────────────

        [Fact]
        public async Task ClearAllTeamMembers_RemovesAllMembersAndRelatedData()
        {
            // Seed members, a plan, an assignment, and a progress update
            var member = new TeamMember { Name = "Alice", IsLead = true };
            _context.TeamMembers.Add(member);

            var plan = new WeeklyPlan { ClientPercentage = 50, TechDebtPercentage = 50, RnDPercentage = 0 };
            _context.WeeklyPlans.Add(plan);
            await _context.SaveChangesAsync();

            var assignment = new TaskAssignment { WeeklyPlanId = plan.Id, TeamMemberId = member.Id, PlannedHours = 5 };
            _context.TaskAssignments.Add(assignment);
            await _context.SaveChangesAsync();

            var progress = new ProgressUpdate { TaskAssignmentId = assignment.Id, CompletedHours = 2, Status = "In Progress" };
            _context.ProgressUpdates.Add(progress);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.ClearAllTeamMembers();

            // Assert
            Assert.IsType<NoContentResult>(result);
            Assert.Equal(0, await _context.TeamMembers.CountAsync());
            Assert.Equal(0, await _context.WeeklyPlans.CountAsync());
            Assert.Equal(0, await _context.TaskAssignments.CountAsync());
        }
    }
}
