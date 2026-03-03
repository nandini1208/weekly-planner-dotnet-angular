using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WeeklyPlanner.API.Data;
using WeeklyPlanner.API.Models;

namespace WeeklyPlanner.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TeamController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TeamController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Team
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TeamMember>>> GetTeamMembers()
        {
            return await _context.TeamMembers.ToListAsync();
        }

        // POST: api/Team
        [HttpPost]
        public async Task<ActionResult<TeamMember>> PostTeamMember(TeamMember member)
        {
            _context.TeamMembers.Add(member);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetTeamMembers), new { id = member.Id }, member);
        }

        // PUT: api/Team/{id}/makeLead
        [HttpPut("{id}/makeLead")]
        public async Task<IActionResult> MakeLead(int id)
        {
            var member = await _context.TeamMembers.FindAsync(id);
            if (member == null) return NotFound();

            var currentLead = await _context.TeamMembers.FirstOrDefaultAsync(m => m.IsLead);
            if (currentLead != null)
            {
                currentLead.IsLead = false;
            }

            member.IsLead = true;
            await _context.SaveChangesAsync();

            return NoContent();
        }
        // DELETE: api/Team/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTeamMember(int id)
        {
            var member = await _context.TeamMembers.FindAsync(id);
            if (member == null) return NotFound();

            _context.TeamMembers.Remove(member);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Team
        [HttpDelete]
        public async Task<IActionResult> ClearAllTeamMembers()
        {
            var allMembers = await _context.TeamMembers.ToListAsync();
            _context.TeamMembers.RemoveRange(allMembers);

            var allPlans = await _context.WeeklyPlans.ToListAsync();
            _context.WeeklyPlans.RemoveRange(allPlans);

            var allAssignments = await _context.TaskAssignments.ToListAsync();
            _context.TaskAssignments.RemoveRange(allAssignments);

            var allUpdates = await _context.ProgressUpdates.ToListAsync();
            _context.ProgressUpdates.RemoveRange(allUpdates);

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
