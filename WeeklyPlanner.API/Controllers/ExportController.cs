using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WeeklyPlanner.API.Data;
using WeeklyPlanner.API.Models;

namespace WeeklyPlanner.API.Controllers
{
    /// <summary>
    /// Provides data export and import functionality.
    /// GET /api/Export/all returns the full database as JSON for backup.
    /// POST /api/Export/import restores data from a previously exported JSON file.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class ExportController : ControllerBase
    {
        private readonly AppDbContext _context;

        /// <summary>Injects the database context for direct entity access.</summary>
        public ExportController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Export/all  — download everything as JSON
        [HttpGet("all")]
        public async Task<ActionResult> ExportAll()
        {
            var data = new
            {
                exportedAt = DateTime.UtcNow,
                teamMembers = await _context.TeamMembers.ToListAsync(),
                backlogItems = await _context.BacklogItems.ToListAsync(),
                weeklyPlans = await _context.WeeklyPlans.ToListAsync(),
                taskAssignments = await _context.TaskAssignments.ToListAsync(),
                progressUpdates = await _context.ProgressUpdates.ToListAsync()
            };

            return Ok(data);
        }

        // POST: api/Export/import  — restore data from JSON
        [HttpPost("import")]
        public async Task<ActionResult> ImportAll([FromBody] ImportPayload payload)
        {
            if (payload == null) return BadRequest("No data provided.");

            try
            {
                // Import team members (skip if already exists by Id)
                if (payload.TeamMembers != null)
                {
                    foreach (var m in payload.TeamMembers)
                    {
                        if (!await _context.TeamMembers.AnyAsync(x => x.Id == m.Id))
                            _context.TeamMembers.Add(m);
                    }
                }

                // Import backlog items
                if (payload.BacklogItems != null)
                {
                    foreach (var b in payload.BacklogItems)
                    {
                        if (!await _context.BacklogItems.AnyAsync(x => x.Id == b.Id))
                            _context.BacklogItems.Add(b);
                    }
                }

                // Import weekly plans
                if (payload.WeeklyPlans != null)
                {
                    foreach (var p in payload.WeeklyPlans)
                    {
                        if (!await _context.WeeklyPlans.AnyAsync(x => x.Id == p.Id))
                            _context.WeeklyPlans.Add(p);
                    }
                }

                // Import task assignments
                if (payload.TaskAssignments != null)
                {
                    foreach (var a in payload.TaskAssignments)
                    {
                        if (!await _context.TaskAssignments.AnyAsync(x => x.Id == a.Id))
                            _context.TaskAssignments.Add(a);
                    }
                }

                // Import progress updates
                if (payload.ProgressUpdates != null)
                {
                    foreach (var u in payload.ProgressUpdates)
                    {
                        if (!await _context.ProgressUpdates.AnyAsync(x => x.Id == u.Id))
                            _context.ProgressUpdates.Add(u);
                    }
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "Data imported successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest($"Import failed: {ex.Message}");
            }
        }
    }

    public class ImportPayload
    {
        public List<TeamMember>? TeamMembers { get; set; }
        public List<BacklogItem>? BacklogItems { get; set; }
        public List<WeeklyPlan>? WeeklyPlans { get; set; }
        public List<TaskAssignment>? TaskAssignments { get; set; }
        public List<ProgressUpdate>? ProgressUpdates { get; set; }
    }
}
