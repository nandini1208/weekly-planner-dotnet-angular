using Microsoft.EntityFrameworkCore;
using WeeklyPlanner.API.Models;

namespace WeeklyPlanner.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<TeamMember> TeamMembers { get; set; }
        public DbSet<BacklogItem> BacklogItems { get; set; }
        public DbSet<WeeklyPlan> WeeklyPlans { get; set; }
        public DbSet<TaskAssignment> TaskAssignments { get; set; }
        public DbSet<ProgressUpdate> ProgressUpdates { get; set; }
    }
}