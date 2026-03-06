using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WeeklyPlanner.API.Data;
using WeeklyPlanner.API.Models;

namespace WeeklyPlanner.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BacklogController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BacklogController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Backlog
        [HttpGet]
        public async Task<ActionResult<IEnumerable<BacklogItem>>> GetBacklogItems()
        {
            return await _context.BacklogItems.ToListAsync();
        }

        // POST: api/Backlog
        [HttpPost]
        public async Task<ActionResult<BacklogItem>> PostBacklogItem(BacklogItem item)
        {
            _context.BacklogItems.Add(item);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetBacklogItems), new { id = item.Id }, item);
        }

        // PUT: api/Backlog/5
        [HttpPut("{id}")]
        public async Task<ActionResult<BacklogItem>> UpdateBacklogItem(int id, BacklogItem item)
        {
            if (id != item.Id) return BadRequest("ID mismatch.");

            var existing = await _context.BacklogItems.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Title = item.Title;
            existing.Description = item.Description;
            existing.Category = item.Category;
            existing.EstimatedHours = item.EstimatedHours;
            existing.Status = item.Status;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }
    }
}
