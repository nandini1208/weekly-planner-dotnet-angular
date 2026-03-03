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

        // DELETE: api/Reset  — wipes every table
        [HttpDelete]
        public async Task<IActionResult> ResetAll()
        {
            // Order matters: delete children before parents (FK constraints)
            var updates = await _context.ProgressUpdates.ToListAsync();
            _context.ProgressUpdates.RemoveRange(updates);

            var assignments = await _context.TaskAssignments.ToListAsync();
            _context.TaskAssignments.RemoveRange(assignments);

            var plans = await _context.WeeklyPlans.ToListAsync();
            _context.WeeklyPlans.RemoveRange(plans);

            var backlog = await _context.BacklogItems.ToListAsync();
            _context.BacklogItems.RemoveRange(backlog);

            var members = await _context.TeamMembers.ToListAsync();
            _context.TeamMembers.RemoveRange(members);

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
