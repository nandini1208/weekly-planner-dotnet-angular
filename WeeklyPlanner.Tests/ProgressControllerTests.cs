using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using WeeklyPlanner.API.Controllers;
using WeeklyPlanner.API.Data;
using WeeklyPlanner.API.Models;
using WeeklyPlanner.API.Services;
using Xunit;

namespace WeeklyPlanner.Tests
{
    /// <summary>
    /// Unit tests for ProgressController endpoints using Moq for the service layer.
    /// Covers: UpdateProgress (success/failure), GetMemberProgress, GetTeamProgress.
    /// </summary>
    public class ProgressControllerTests
    {
        private readonly Mock<IWeeklyPlanService> _mockService;
        private readonly ProgressController _controller;

        public ProgressControllerTests()
        {
            _mockService = new Mock<IWeeklyPlanService>();
            _controller = new ProgressController(_mockService.Object);
        }

        // ─── UPDATE PROGRESS ──────────────────────────────────────────────────

        [Fact]
        public async Task UpdateProgress_ValidRequest_ReturnsOkWithProgressUpdate()
        {
            // Arrange
            var request = new ProgressUpdateRequest { AssignmentId = 1, CompletedHours = 5, Status = "In Progress" };
            var expected = new ProgressUpdate { Id = 1, TaskAssignmentId = 1, CompletedHours = 5, Status = "In Progress" };

            _mockService
                .Setup(s => s.UpdateProgressAsync(request.AssignmentId, request.CompletedHours, request.Status))
                .ReturnsAsync(expected);

            // Act
            var result = await _controller.UpdateProgress(request);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var returned = Assert.IsType<ProgressUpdate>(ok.Value);
            Assert.Equal("In Progress", returned.Status);
            Assert.Equal(5, returned.CompletedHours);
        }

        [Fact]
        public async Task UpdateProgress_ServiceThrows_ReturnsBadRequest()
        {
            // Arrange
            var request = new ProgressUpdateRequest { AssignmentId = 999, CompletedHours = 5, Status = "Done" };

            _mockService
                .Setup(s => s.UpdateProgressAsync(request.AssignmentId, request.CompletedHours, request.Status))
                .ThrowsAsync(new Exception("Assignment not found."));

            // Act
            var result = await _controller.UpdateProgress(request);

            // Assert
            var bad = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Assignment not found.", bad.Value);
        }

        [Fact]
        public async Task UpdateProgress_StatusDone_ReturnsOk()
        {
            // Arrange — verifies status "Done" is accepted and saved correctly
            var request = new ProgressUpdateRequest { AssignmentId = 2, CompletedHours = 8, Status = "Done" };
            var expected = new ProgressUpdate { Id = 2, TaskAssignmentId = 2, CompletedHours = 8, Status = "Done" };

            _mockService
                .Setup(s => s.UpdateProgressAsync(2, 8, "Done"))
                .ReturnsAsync(expected);

            var result = await _controller.UpdateProgress(request);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var returned = Assert.IsType<ProgressUpdate>(ok.Value);
            Assert.Equal("Done", returned.Status);
        }

        // ─── GET MEMBER PROGRESS ──────────────────────────────────────────────

        [Fact]
        public async Task GetMemberProgress_ValidIds_ReturnsOkWithData()
        {
            // Arrange
            var memberId = 1;
            var planId = 10;
            var fakeData = new List<object>
            {
                new { TaskName = "Task A", PlannedHours = 8, CompletedHours = 4, Status = "In Progress" },
                new { TaskName = "Task B", PlannedHours = 6, CompletedHours = 6, Status = "Done" }
            };

            _mockService
                .Setup(s => s.GetMemberProgressAsync(memberId, planId))
                .ReturnsAsync(fakeData);

            // Act
            var result = await _controller.GetMemberProgress(memberId, planId);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var items = Assert.IsAssignableFrom<IEnumerable<object>>(ok.Value);
            Assert.Equal(2, items.Count());
        }

        [Fact]
        public async Task GetMemberProgress_NoTasks_ReturnsEmptyList()
        {
            _mockService
                .Setup(s => s.GetMemberProgressAsync(99, 99))
                .ReturnsAsync(new List<object>());

            var result = await _controller.GetMemberProgress(99, 99);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var items = Assert.IsAssignableFrom<IEnumerable<object>>(ok.Value);
            Assert.Empty(items);
        }

        // ─── GET TEAM PROGRESS ────────────────────────────────────────────────

        [Fact]
        public async Task GetTeamProgress_ValidPlanId_ReturnsOkWithAllMembersData()
        {
            // Arrange
            var planId = 5;
            var fakeTeamData = new List<object>
            {
                new { MemberName = "Alice", TotalPlanned = 20, TotalCompleted = 15 },
                new { MemberName = "Bob",   TotalPlanned = 30, TotalCompleted = 10 }
            };

            _mockService
                .Setup(s => s.GetTeamProgressAsync(planId))
                .ReturnsAsync(fakeTeamData);

            // Act
            var result = await _controller.GetTeamProgress(planId);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var items = Assert.IsAssignableFrom<IEnumerable<object>>(ok.Value);
            Assert.Equal(2, items.Count());
        }

        [Fact]
        public async Task GetTeamProgress_NoMembers_ReturnsEmptyList()
        {
            _mockService
                .Setup(s => s.GetTeamProgressAsync(999))
                .ReturnsAsync(new List<object>());

            var result = await _controller.GetTeamProgress(999);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var items = Assert.IsAssignableFrom<IEnumerable<object>>(ok.Value);
            Assert.Empty(items);
        }
    }
}
