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
    /// Unit tests for BacklogController endpoints using an isolated in-memory database.
    /// Covers: GetBacklogItems, PostBacklogItem, UpdateBacklogItem (valid/invalid id / id mismatch).
    /// </summary>
    public class BacklogControllerTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly BacklogController _controller;

        public BacklogControllerTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _controller = new BacklogController(_context);
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        // ─── GET ──────────────────────────────────────────────────────────────

        [Fact]
        public async Task GetBacklogItems_EmptyDb_ReturnsEmptyList()
        {
            var result = await _controller.GetBacklogItems();

            var items = Assert.IsAssignableFrom<IEnumerable<BacklogItem>>(result.Value);
            Assert.Empty(items);
        }

        [Fact]
        public async Task GetBacklogItems_WithItems_ReturnsAllItems()
        {
            _context.BacklogItems.AddRange(
                new BacklogItem { Title = "Task A", Category = "Client Focused", EstimatedHours = 4, Status = "Available" },
                new BacklogItem { Title = "Task B", Category = "Tech Debt",      EstimatedHours = 2, Status = "Available" },
                new BacklogItem { Title = "Task C", Category = "R&D",            EstimatedHours = 6, Status = "Available" }
            );
            await _context.SaveChangesAsync();

            var result = await _controller.GetBacklogItems();

            var items = Assert.IsAssignableFrom<IEnumerable<BacklogItem>>(result.Value);
            Assert.Equal(3, items.Count());
        }

        // ─── POST ─────────────────────────────────────────────────────────────

        [Fact]
        public async Task PostBacklogItem_ValidItem_ReturnsCreated()
        {
            var item = new BacklogItem { Title = "New Feature", Category = "Client Focused", EstimatedHours = 8, Status = "Available" };

            var result = await _controller.PostBacklogItem(item);

            var created = Assert.IsType<CreatedAtActionResult>(result.Result);
            var returned = Assert.IsType<BacklogItem>(created.Value);
            Assert.Equal("New Feature", returned.Title);
            Assert.Equal("Client Focused", returned.Category);
        }

        [Fact]
        public async Task PostBacklogItem_ValidItem_PersistsToDatabase()
        {
            var item = new BacklogItem { Title = "Persist Me", Category = "R&D", EstimatedHours = 3, Status = "Available" };

            await _controller.PostBacklogItem(item);

            Assert.Equal(1, await _context.BacklogItems.CountAsync());
            Assert.Equal("Persist Me", (await _context.BacklogItems.FirstAsync()).Title);
        }

        // ─── PUT ──────────────────────────────────────────────────────────────

        [Fact]
        public async Task UpdateBacklogItem_ValidId_UpdatesAllFields()
        {
            var item = new BacklogItem { Title = "Old Title", Category = "Tech Debt", EstimatedHours = 3, Status = "Available" };
            _context.BacklogItems.Add(item);
            await _context.SaveChangesAsync();

            var updatedItem = new BacklogItem
            {
                Id = item.Id,
                Title = "New Title",
                Category = "Client Focused",
                EstimatedHours = 6,
                Status = "In Progress"
            };

            var result = await _controller.UpdateBacklogItem(item.Id, updatedItem);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var saved = Assert.IsType<BacklogItem>(ok.Value);
            Assert.Equal("New Title", saved.Title);
            Assert.Equal("Client Focused", saved.Category);
            Assert.Equal(6, saved.EstimatedHours);
            Assert.Equal("In Progress", saved.Status);
        }

        [Fact]
        public async Task UpdateBacklogItem_InvalidId_ReturnsNotFound()
        {
            var updatedItem = new BacklogItem { Id = 999, Title = "Ghost", Category = "R&D", EstimatedHours = 1, Status = "Available" };

            var result = await _controller.UpdateBacklogItem(999, updatedItem);

            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task UpdateBacklogItem_IdMismatch_ReturnsBadRequest()
        {
            // Route ID doesn't match the body's ID
            var item = new BacklogItem { Id = 10, Title = "Mismatch", Category = "R&D", EstimatedHours = 1, Status = "Available" };

            var result = await _controller.UpdateBacklogItem(99, item);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("ID mismatch.", badRequest.Value);
        }
    }
}
