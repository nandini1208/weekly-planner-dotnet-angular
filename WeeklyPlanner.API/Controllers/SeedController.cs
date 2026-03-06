using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WeeklyPlanner.API.Data;
using WeeklyPlanner.API.Models;

namespace WeeklyPlanner.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SeedController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SeedController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> SeedAll()
        {
            // 1. Reset first
            if (_context.Database.IsRelational())
            {
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM ProgressUpdates");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM TaskAssignments");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM WeeklyPlans");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM BacklogItems");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM TeamMembers");
            }
            else
            {
                _context.ProgressUpdates.RemoveRange(_context.ProgressUpdates);
                _context.TaskAssignments.RemoveRange(_context.TaskAssignments);
                _context.WeeklyPlans.RemoveRange(_context.WeeklyPlans);
                _context.BacklogItems.RemoveRange(_context.BacklogItems);
                _context.TeamMembers.RemoveRange(_context.TeamMembers);
                await _context.SaveChangesAsync();
            }

            // 2. Sample Members
            var members = new List<TeamMember>
            {
                new TeamMember { Name = "Alice Chen", IsLead = true },
                new TeamMember { Name = "Bob Martinez", IsLead = false },
                new TeamMember { Name = "Carol Singh", IsLead = false },
                new TeamMember { Name = "Dave Kim", IsLead = false }
            };
            _context.TeamMembers.AddRange(members);
            await _context.SaveChangesAsync(); // Need IDs for future references (though not used here yet)

            // 3. Sample Backlog
            var backlog = new List<BacklogItem>
            {
                new BacklogItem { Title = "Customer onboarding redesign", Description = "Revamp the onboarding flow for new customers.", Category = "Client Focused", EstimatedHours = 12, Status = "Available" },
                new BacklogItem { Title = "Fix billing invoice formatting", Description = "Some invoices show wrong currency format.", Category = "Client Focused", EstimatedHours = 4, Status = "Available" },
                new BacklogItem { Title = "Customer feedback dashboard", Description = "Build a dashboard showing NPS scores.", Category = "Client Focused", EstimatedHours = 16, Status = "Available" },
                new BacklogItem { Title = "Migrate database to PostgreSQL 16", Description = "Upgrade from PG 14 to PG 16.", Category = "Tech Debt", EstimatedHours = 20, Status = "Available" },
                new BacklogItem { Title = "Remove deprecated API endpoints", Description = "Clean up v1 API routes.", Category = "Tech Debt", EstimatedHours = 8, Status = "Available" },
                new BacklogItem { Title = "Add unit tests for payment module", Description = "Coverage is below 50%.", Category = "Tech Debt", EstimatedHours = 10, Status = "Available" },
                new BacklogItem { Title = "Experiment with LLM-based search", Description = "Prototype semantic search using embeddings.", Category = "R&D", EstimatedHours = 15, Status = "Available" },
                new BacklogItem { Title = "Evaluate new caching strategy", Description = "Compare Redis Cluster vs Memcached.", Category = "R&D", EstimatedHours = 6, Status = "Available" },
                new BacklogItem { Title = "Build internal CLI tool", Description = "A command-line tool for common dev tasks.", Category = "R&D", EstimatedHours = 8, Status = "Available" },
                new BacklogItem { Title = "Client SSO integration", Description = "Support SAML-based single sign-on for enterprise clients.", Category = "Client Focused", EstimatedHours = 18, Status = "Available" }
            };
            _context.BacklogItems.AddRange(backlog);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Data seeded successfully" });
        }
    }
}
