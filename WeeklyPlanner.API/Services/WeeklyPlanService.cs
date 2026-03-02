using Microsoft.EntityFrameworkCore;
using WeeklyPlanner.API.Data;
using WeeklyPlanner.API.Models;

namespace WeeklyPlanner.API.Services
{
    public class WeeklyPlanService : IWeeklyPlanService
    {
        private readonly AppDbContext _context;

        public WeeklyPlanService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<WeeklyPlan> CreatePlanAsync(WeeklyPlan plan)
        {
            if (plan.ClientPercentage + plan.TechDebtPercentage + plan.RnDPercentage != 100)
                throw new ArgumentException("Category percentages must total 100%.");

            _context.WeeklyPlans.Add(plan);
            await _context.SaveChangesAsync();
            return plan;
        }

        public async Task<WeeklyPlan> FreezePlanAsync(int planId)
        {
            var plan = await _context.WeeklyPlans.FindAsync(planId);
            if (plan == null) throw new KeyNotFoundException("Plan not found");

            plan.IsFrozen = true;
            await _context.SaveChangesAsync();
            return plan;
        }

        public async Task<TaskAssignment> AddAssignmentAsync(TaskAssignment assignment)
        {
            var plan = await _context.WeeklyPlans.FindAsync(assignment.WeeklyPlanId);
            if (plan == null) throw new KeyNotFoundException("Plan not found");
            if (plan.IsFrozen) throw new InvalidOperationException("Cannot add assignments to a frozen plan.");

            var memberAssignments = await _context.TaskAssignments
                .Where(a => a.WeeklyPlanId == assignment.WeeklyPlanId && a.TeamMemberId == assignment.TeamMemberId)
                .SumAsync(a => a.PlannedHours);

            if (memberAssignments + assignment.PlannedHours > 30)
                throw new InvalidOperationException("A member cannot plan more than 30 hours per week.");

            _context.TaskAssignments.Add(assignment);
            await _context.SaveChangesAsync();

            // Auto-create initial progress update
            var update = new ProgressUpdate
            {
                TaskAssignmentId = assignment.Id,
                CompletedHours = 0,
                Status = "To Do"
            };
            _context.ProgressUpdates.Add(update);
            await _context.SaveChangesAsync();

            return assignment;
        }

        public async Task<ProgressUpdate> UpdateProgressAsync(int assignmentId, int completedHours, string status)
        {
            var update = new ProgressUpdate
            {
                TaskAssignmentId = assignmentId,
                CompletedHours = completedHours,
                Status = status,
                UpdateDate = DateTime.UtcNow
            };
            _context.ProgressUpdates.Add(update);
            await _context.SaveChangesAsync();

            // Update associated backlog item status based on progress updates
            var assignment = await _context.TaskAssignments.FindAsync(assignmentId);
            if (assignment != null)
            {
                var backlogItem = await _context.BacklogItems.FindAsync(assignment.BacklogItemId);
                if (backlogItem != null && status != backlogItem.Status)
                {
                    backlogItem.Status = status;
                    await _context.SaveChangesAsync();
                }
            }

            return update;
        }
    }
}
