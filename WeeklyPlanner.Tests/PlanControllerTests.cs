using Microsoft.AspNetCore.Mvc;
using Moq;
using System;
using System.Threading.Tasks;
using WeeklyPlanner.API.Controllers;
using WeeklyPlanner.API.Models;
using WeeklyPlanner.API.Services;
using Xunit;

namespace WeeklyPlanner.Tests
{
    public class PlanControllerTests
    {
        private readonly Mock<IWeeklyPlanService> _mockService;
        private readonly PlanController _controller;

        public PlanControllerTests()
        {
            _mockService = new Mock<IWeeklyPlanService>();
            _controller = new PlanController(_mockService.Object);
        }

        [Fact]
        public async Task CreatePlan_ValidPlan_ReturnsOkResult()
        {
            var plan = new WeeklyPlan { ClientPercentage = 50, TechDebtPercentage = 30, RnDPercentage = 20 };
            _mockService.Setup(s => s.CreatePlanAsync(plan)).ReturnsAsync(plan);

            var result = await _controller.CreatePlan(plan);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(plan, okResult.Value);
        }

        [Fact]
        public async Task CreatePlan_InvalidPlan_ReturnsBadRequest()
        {
            var plan = new WeeklyPlan { ClientPercentage = 50, TechDebtPercentage = 30, RnDPercentage = 10 };
            _mockService.Setup(s => s.CreatePlanAsync(plan)).ThrowsAsync(new ArgumentException("Category percentages must total 100%."));

            var result = await _controller.CreatePlan(plan);

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Category percentages must total 100%.", badRequestResult.Value);
        }

        [Fact]
        public async Task FreezePlan_ValidId_ReturnsOkResult()
        {
            var planId = 1;
            var plan = new WeeklyPlan { Id = planId, IsFrozen = true };
            _mockService.Setup(s => s.FreezePlanAsync(planId)).ReturnsAsync(plan);

            var result = await _controller.FreezePlan(planId);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(plan, okResult.Value);
        }

        [Fact]
        public async Task FreezePlan_InvalidId_ReturnsNotFound()
        {
            var planId = 999;
            _mockService.Setup(s => s.FreezePlanAsync(planId)).ThrowsAsync(new KeyNotFoundException("Plan not found"));

            var result = await _controller.FreezePlan(planId);

            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Plan not found", notFoundResult.Value);
        }

        [Fact]
        public async Task GetPlans_ReturnsAllPlans()
        {
            var plans = new List<WeeklyPlan> { new WeeklyPlan { Id = 1 }, new WeeklyPlan { Id = 2 } };
            _mockService.Setup(s => s.GetPlansAsync()).ReturnsAsync(plans);

            var result = await _controller.GetPlans();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(plans, okResult.Value);
        }

        [Fact]
        public async Task FinishWeek_ValidId_ReturnsOkResult()
        {
            var planId = 1;
            var plan = new WeeklyPlan { Id = planId, IsCompleted = true };
            _mockService.Setup(s => s.ClosePlanAsync(planId)).ReturnsAsync(plan);

            var result = await _controller.FinishWeek(planId);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(plan, okResult.Value);
        }

        [Fact]
        public async Task CreatePlan_NotTuesday_ReturnsBadRequest()
        {
            var plan = new WeeklyPlan { StartDate = DateTime.Now }; // Not necessarily a Tuesday
            _mockService.Setup(s => s.CreatePlanAsync(plan))
                .ThrowsAsync(new ArgumentException("Planning cycles can only be initialized on Tuesdays."));

            var result = await _controller.CreatePlan(plan);

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Planning cycles can only be initialized on Tuesdays.", badRequestResult.Value);
        }
    }
}
