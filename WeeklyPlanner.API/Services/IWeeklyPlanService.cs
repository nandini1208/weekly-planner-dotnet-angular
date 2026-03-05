using WeeklyPlanner.API.Models;

namespace WeeklyPlanner.API.Services
{
    public interface IWeeklyPlanService
    {
        Task<WeeklyPlan> CreatePlanAsync(WeeklyPlan plan);
        Task<IEnumerable<WeeklyPlan>> GetPlansAsync();
        Task DeletePlanAsync(int planId);
        Task<WeeklyPlan> FreezePlanAsync(int planId);
        Task<TaskAssignment> AddAssignmentAsync(TaskAssignment assignment);
        Task<IEnumerable<TaskAssignment>> GetAssignmentsByPlanIdAsync(int planId);
        Task DeleteAssignmentsByMemberAsync(int planId, int memberId);
        Task<ProgressUpdate> UpdateProgressAsync(int assignmentId, int completedHours, string status);
        Task<IEnumerable<object>> GetMemberProgressAsync(int memberId, int planId);
        Task<IEnumerable<object>> GetTeamProgressAsync(int planId);
        Task<object> GetPlanSummaryAsync(int planId);
    }
}
