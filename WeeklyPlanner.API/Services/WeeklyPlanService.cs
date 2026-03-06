using Microsoft.EntityFrameworkCore;
using WeeklyPlanner.API.Data;
using WeeklyPlanner.API.Models;

namespace WeeklyPlanner.API.Services
{
    /// <summary>
    /// Core engine for the Weekly Planner. Enforces all exercise constraints:
    /// - Planning only on Tuesdays.
    /// - Strict 30-hour weekly capacity per member.
    /// - Automated progress tracking and backlog state management.
    /// </summary>
    public class WeeklyPlanService : IWeeklyPlanService
    {
        private readonly AppDbContext _context;
        private readonly IDateTimeProvider _dateTimeProvider;

        public WeeklyPlanService(AppDbContext context, IDateTimeProvider dateTimeProvider)
        {
            _context = context;
            _dateTimeProvider = dateTimeProvider;
        }

        public async Task<WeeklyPlan> CreatePlanAsync(WeeklyPlan plan)
        {
            // Requirement check: Planning must happen on Tuesday (DayOfWeek.Tuesday)
            if (plan.StartDate.DayOfWeek != DayOfWeek.Tuesday)
                throw new ArgumentException("Planning cycles can only be initialized on Tuesdays as per team requirements.");

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

        public async Task<IEnumerable<WeeklyPlan>> GetPlansAsync()
        {
            return await _context.WeeklyPlans.ToListAsync();
        }

        public async Task DeletePlanAsync(int planId)
        {
            var plan = await _context.WeeklyPlans.FindAsync(planId);
            if (plan == null) throw new KeyNotFoundException("Plan not found");

            _context.WeeklyPlans.Remove(plan);
            await _context.SaveChangesAsync();
        }

        public async Task<TaskAssignment> AddAssignmentAsync(TaskAssignment assignment)
        {
            var plan = await _context.WeeklyPlans.FindAsync(assignment.WeeklyPlanId);
            if (plan == null) throw new KeyNotFoundException("Plan not found");
            if (plan.IsFrozen) throw new InvalidOperationException("Cannot add assignments to a frozen plan.");

            var memberAssignments = await _context.TaskAssignments
                .Where(a => a.WeeklyPlanId == assignment.WeeklyPlanId && a.TeamMemberId == assignment.TeamMemberId)
                .SumAsync(a => a.PlannedHours);

            // Requirement check: Every member has exactly 30 hours of work to plan.
            // This 30h limit accounts for 8h/day * 4 days minus the 2h weekly meeting buffer.
            if (memberAssignments + assignment.PlannedHours > 30)
                throw new InvalidOperationException("Weekly capacity is strictly limited to 30 hours (including the 2h weekly meeting allocation).");

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

        // Get all assignments for a plan (includes BacklogItem info)
        public async Task<IEnumerable<TaskAssignment>> GetAssignmentsByPlanIdAsync(int planId)
        {
            return await _context.TaskAssignments
                .Where(a => a.WeeklyPlanId == planId)
                .Include(a => a.BacklogItem)
                .ToListAsync();
        }

        // Delete all assignments for a member in a plan (so they can re-submit)
        public async Task DeleteAssignmentsByMemberAsync(int planId, int memberId)
        {
            var existing = _context.TaskAssignments
                .Where(a => a.WeeklyPlanId == planId && a.TeamMemberId == memberId);
            _context.TaskAssignments.RemoveRange(existing);
            await _context.SaveChangesAsync();
        }

        public async Task<ProgressUpdate> UpdateProgressAsync(int assignmentId, int completedHours, string status)
        {
            var update = new ProgressUpdate
            {
                TaskAssignmentId = assignmentId,
                CompletedHours = completedHours,
                Status = status,
                UpdateDate = _dateTimeProvider.UtcNow
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

        // Return each assignment for a member with the latest progress update
        public async Task<IEnumerable<object>> GetMemberProgressAsync(int memberId, int planId)
        {
            var assignments = await _context.TaskAssignments
                .Where(a => a.WeeklyPlanId == planId && a.TeamMemberId == memberId)
                .Include(a => a.BacklogItem)
                .ToListAsync();

            var result = new List<object>();
            foreach (var a in assignments)
            {
                // Get the latest progress update for this assignment
                var latest = await _context.ProgressUpdates
                    .Where(p => p.TaskAssignmentId == a.Id)
                    .OrderByDescending(p => p.UpdateDate)
                    .FirstOrDefaultAsync();

                result.Add(new
                {
                    assignmentId = a.Id,
                    backlogItemId = a.BacklogItemId,
                    title = a.BacklogItem?.Title ?? $"Item #{a.BacklogItemId}",
                    category = a.BacklogItem?.Category ?? "",
                    plannedHours = a.PlannedHours,
                    completedHours = latest?.CompletedHours ?? 0,
                    status = latest?.Status ?? "To Do",
                    lastUpdated = latest?.UpdateDate
                });
            }
            return result;
        }

        // Full team progress for the lead's overview
        public async Task<IEnumerable<object>> GetTeamProgressAsync(int planId)
        {
            var assignments = await _context.TaskAssignments
                .Where(a => a.WeeklyPlanId == planId)
                .Include(a => a.BacklogItem)
                .ToListAsync();

            var members = await _context.TeamMembers.ToListAsync();
            var plan = await _context.WeeklyPlans.FindAsync(planId);
            int capacity = plan != null && members.Count > 0
                ? plan.TotalPlannedHours / members.Count
                : 30;

            var result = new List<object>();

            foreach (var member in members)
            {
                var memberAssignments = assignments.Where(a => a.TeamMemberId == member.Id).ToList();
                var tasks = new List<object>();
                int totalPlanned = 0, totalCompleted = 0;

                foreach (var a in memberAssignments)
                {
                    var latest = await _context.ProgressUpdates
                        .Where(p => p.TaskAssignmentId == a.Id)
                        .OrderByDescending(p => p.UpdateDate)
                        .FirstOrDefaultAsync();

                    totalPlanned += a.PlannedHours;
                    totalCompleted += latest?.CompletedHours ?? 0;

                    tasks.Add(new
                    {
                        assignmentId = a.Id,
                        title = a.BacklogItem?.Title ?? $"Item #{a.BacklogItemId}",
                        category = a.BacklogItem?.Category ?? "",
                        plannedHours = a.PlannedHours,
                        completedHours = latest?.CompletedHours ?? 0,
                        status = latest?.Status ?? "To Do",
                        lastUpdated = latest?.UpdateDate
                    });
                }

                result.Add(new
                {
                    memberId = member.Id,
                    memberName = member.Name,
                    isLead = member.IsLead,
                    capacity,
                    totalPlanned,
                    totalCompleted,
                    tasks
                });
            }

            return result;
        }

        // Rich summary for a single plan (used by View Past Weeks)
        public async Task<object> GetPlanSummaryAsync(int planId)
        {
            var plan = await _context.WeeklyPlans.FindAsync(planId);
            if (plan == null) throw new KeyNotFoundException("Plan not found");

            var assignments = await _context.TaskAssignments
                .Where(a => a.WeeklyPlanId == planId)
                .Include(a => a.BacklogItem)
                .ToListAsync();

            var members = await _context.TeamMembers.ToListAsync();
            int totalPlanned = 0, totalCompleted = 0;
            var memberResults = new List<object>();

            foreach (var member in members)
            {
                var mine = assignments.Where(a => a.TeamMemberId == member.Id).ToList();
                if (mine.Count == 0) continue;

                int mPlanned = mine.Sum(a => a.PlannedHours);
                int mCompleted = 0;

                foreach (var a in mine)
                {
                    var latest = await _context.ProgressUpdates
                        .Where(p => p.TaskAssignmentId == a.Id)
                        .OrderByDescending(p => p.UpdateDate)
                        .Select(p => p.CompletedHours)
                        .FirstOrDefaultAsync();
                    mCompleted += latest;
                }

                totalPlanned += mPlanned;
                totalCompleted += mCompleted;

                memberResults.Add(new {
                    memberName = member.Name,
                    isLead = member.IsLead,
                    planned = mPlanned,
                    completed = mCompleted,
                    percent = mPlanned > 0 ? Math.Min(100, mCompleted * 100 / mPlanned) : 0
                });
            }

            return new
            {
                planId = plan.Id,
                startDate = plan.StartDate,
                isFrozen = plan.IsFrozen,
                isCompleted = plan.IsCompleted,
                totalPlannedHours = plan.TotalPlannedHours,
                clientPercentage = plan.ClientPercentage,
                techDebtPercentage = plan.TechDebtPercentage,
                rnDPercentage = plan.RnDPercentage,
                totalPlanned,
                totalCompleted,
                overallPercent = totalPlanned > 0 ? Math.Min(100, totalCompleted * 100 / totalPlanned) : 0,
                memberResults
            };
        }

        public async Task<WeeklyPlan> ClosePlanAsync(int planId)
        {
            var plan = await _context.WeeklyPlans.FindAsync(planId);
            if (plan == null) throw new KeyNotFoundException("Plan not found");

            plan.IsCompleted = true;

            // Find unfinished backlog items and reset them
            var assignments = await _context.TaskAssignments
                .Where(a => a.WeeklyPlanId == planId)
                .ToListAsync();

            foreach (var a in assignments)
            {
                var latestUpdate = await _context.ProgressUpdates
                    .Where(p => p.TaskAssignmentId == a.Id)
                    .OrderByDescending(p => p.UpdateDate)
                    .FirstOrDefaultAsync();

                if (latestUpdate == null || latestUpdate.Status != "Done")
                {
                    var item = await _context.BacklogItems.FindAsync(a.BacklogItemId);
                    if (item != null)
                    {
                        item.Status = "Available"; // Reset unfinished items
                    }
                }
            }

            await _context.SaveChangesAsync();
            return plan;
        }
    }
}
