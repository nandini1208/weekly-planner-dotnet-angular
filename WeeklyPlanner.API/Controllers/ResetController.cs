using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WeeklyPlanner.API.Data;

namespace WeeklyPlanner.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ResetController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ResetController(AppDbContext context)
        {
            _context = context;
        }

        [HttpDelete]
        public async Task<IActionResult> ResetAll()
        {
            if (_context.Database.IsRelational())
            {
                // Faster wipe using raw SQL (order handles FKs)
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM ProgressUpdates");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM TaskAssignments");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM WeeklyPlans");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM BacklogItems");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM TeamMembers");
            }
            else
            {
                // In-memory fallback for unit tests
                _context.ProgressUpdates.RemoveRange(_context.ProgressUpdates);
                _context.TaskAssignments.RemoveRange(_context.TaskAssignments);
                _context.WeeklyPlans.RemoveRange(_context.WeeklyPlans);
                _context.BacklogItems.RemoveRange(_context.BacklogItems);
                _context.TeamMembers.RemoveRange(_context.TeamMembers);
                await _context.SaveChangesAsync();
            }
            
            return NoContent();
        }
    }
}
