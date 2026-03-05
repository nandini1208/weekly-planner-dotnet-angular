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
        /// <summary>
        /// Imports all entities from a previously exported JSON backup.
        /// REPLACES all existing data — clears the database first, then inserts from the file.
        /// Strips original IDs so SQL Server auto-generates new ones (avoids IDENTITY_INSERT errors).
        /// Tracks old→new ID mappings to preserve referential integrity between related entities.
        /// </summary>
        [HttpPost("import")]
        public async Task<ActionResult> ImportAll([FromBody] ImportPayload payload)
        {
            if (payload == null) return BadRequest("No data provided.");

            try
            {
                // ── STEP 1: Clear all existing data (reverse FK order) ──────────
                _context.ProgressUpdates.RemoveRange(_context.ProgressUpdates);
                _context.TaskAssignments.RemoveRange(_context.TaskAssignments);
                _context.WeeklyPlans.RemoveRange(_context.WeeklyPlans);
                _context.BacklogItems.RemoveRange(_context.BacklogItems);
                _context.TeamMembers.RemoveRange(_context.TeamMembers);
                await _context.SaveChangesAsync();

                // ── STEP 2: Import fresh data with ID remapping ─────────────────
                var memberMap = new Dictionary<int, int>();
                var backlogMap = new Dictionary<int, int>();
                var planMap = new Dictionary<int, int>();
                var assignMap = new Dictionary<int, int>();

                if (payload.TeamMembers != null)
                {
                    foreach (var m in payload.TeamMembers)
                    {
                        var oldId = m.Id; m.Id = 0;
                        _context.TeamMembers.Add(m);
                        await _context.SaveChangesAsync();
                        memberMap[oldId] = m.Id;
                    }
                }

                if (payload.BacklogItems != null)
                {
                    foreach (var b in payload.BacklogItems)
                    {
                        var oldId = b.Id; b.Id = 0;
                        _context.BacklogItems.Add(b);
                        await _context.SaveChangesAsync();
                        backlogMap[oldId] = b.Id;
                    }
                }

                if (payload.WeeklyPlans != null)
                {
                    foreach (var p in payload.WeeklyPlans)
                    {
                        var oldId = p.Id; p.Id = 0;
                        _context.WeeklyPlans.Add(p);
                        await _context.SaveChangesAsync();
                        planMap[oldId] = p.Id;
                    }
                }

                if (payload.TaskAssignments != null)
                {
                    foreach (var a in payload.TaskAssignments)
                    {
                        var oldId = a.Id; a.Id = 0;
                        if (memberMap.TryGetValue(a.TeamMemberId,   out var mId)) a.TeamMemberId  = mId;
                        if (backlogMap.TryGetValue(a.BacklogItemId, out var bId)) a.BacklogItemId = bId;
                        if (planMap.TryGetValue(a.WeeklyPlanId,     out var pId)) a.WeeklyPlanId  = pId;
                        _context.TaskAssignments.Add(a);
                        await _context.SaveChangesAsync();
                        assignMap[oldId] = a.Id;
                    }
                }

                if (payload.ProgressUpdates != null)
                {
                    foreach (var u in payload.ProgressUpdates)
                    {
                        u.Id = 0;
                        if (assignMap.TryGetValue(u.TaskAssignmentId, out var aId))
                            u.TaskAssignmentId = aId;
                        _context.ProgressUpdates.Add(u);
                    }
                    await _context.SaveChangesAsync();
                }

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
