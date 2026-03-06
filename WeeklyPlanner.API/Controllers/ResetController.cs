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

        // DELETE: api/Reset — wipes every table
        [HttpDelete]
        public async Task<IActionResult> ResetAll()
        {
            // Faster wipe using raw SQL (order handles FKs)
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM ProgressUpdates");
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM TaskAssignments");
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM WeeklyPlans");
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM BacklogItems");
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM TeamMembers");
            
            return NoContent();
        }
    }
}
