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
    }
}
