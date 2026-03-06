using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using WeeklyPlanner.API.Controllers;
using WeeklyPlanner.API.Data;
using WeeklyPlanner.API.Models;
using Xunit;

namespace WeeklyPlanner.Tests
{
    public class SeedControllerTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly SeedController _controller;

        public SeedControllerTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _controller = new SeedController(_context);
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        [Fact]
        public async Task SeedAll_ReturnsOk()
        {
            var result = await _controller.SeedAll();

            var okResult = Assert.IsType<OkObjectResult>(result);
            // Verify message
            var res = okResult.Value;
            Assert.NotNull(res);
        }

        [Fact]
        public async Task SeedAll_PopulatesDatabase()
        {
            await _controller.SeedAll();

            // Verify some data was added (InMemory doesn't run the DELETE RawSQL but will run the AddRange)
            // Actually, in many InMemory setups, ExecuteSqlRaw silently does nothing or fails.
            // But the SaveChangesAsync forAddRange WILL work.
            
            var membersCount = await _context.TeamMembers.CountAsync();
            var backlogCount = await _context.BacklogItems.CountAsync();

            Assert.True(membersCount > 0, "Should have seeded team members");
            Assert.True(backlogCount > 0, "Should have seeded backlog items");
        }
    }
}
