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
        Task<ProgressUpdate> UpdateProgressAsync(int assignmentId, int completedHours, string status);
    }
}
