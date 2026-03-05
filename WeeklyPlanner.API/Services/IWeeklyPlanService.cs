using WeeklyPlanner.API.Models;

namespace WeeklyPlanner.API.Services
{
    /// <summary>
    /// Defines the contract for weekly planning operations including
    /// plan creation, task assignments, progress tracking, and reporting.
    /// </summary>
    public interface IWeeklyPlanService
    {
        /// <summary>Creates a new weekly plan. Validates that category percentages sum to 100.</summary>
        Task<WeeklyPlan> CreatePlanAsync(WeeklyPlan plan);

        /// <summary>Returns all weekly plans ordered by most recent first.</summary>
        Task<IEnumerable<WeeklyPlan>> GetPlansAsync();

        /// <summary>Deletes a weekly plan and all its associated task assignments.</summary>
        Task DeletePlanAsync(int planId);

        /// <summary>Freezes a plan so that no more assignments can be added. Members can only update progress after this.</summary>
        Task<WeeklyPlan> FreezePlanAsync(int planId);

        /// <summary>
        /// Adds a task assignment for a member. Validates the plan exists, is not frozen,
        /// and that the member's total planned hours do not exceed the 35-hour server cap.
        /// Also creates an initial ProgressUpdate with status "To Do".
        /// </summary>
        Task<TaskAssignment> AddAssignmentAsync(TaskAssignment assignment);

        /// <summary>Returns all task assignments for a given plan.</summary>
        Task<IEnumerable<TaskAssignment>> GetAssignmentsByPlanIdAsync(int planId);

        /// <summary>Removes all task assignments for a specific member within a given plan.</summary>
        Task DeleteAssignmentsByMemberAsync(int planId, int memberId);

        /// <summary>
        /// Updates the progress for a task assignment. Updates completedHours, status,
        /// and syncs the BacklogItem status accordingly.
        /// </summary>
        Task<ProgressUpdate> UpdateProgressAsync(int assignmentId, int completedHours, string status);

        /// <summary>Returns a member's task assignments with their latest progress updates for a given plan.</summary>
        Task<IEnumerable<object>> GetMemberProgressAsync(int memberId, int planId);

        /// <summary>Returns progress for all members in a plan, grouped by member with per-task breakdown.</summary>
        Task<IEnumerable<object>> GetTeamProgressAsync(int planId);

        /// <summary>Returns a rich completion summary for a frozen plan, including total/per-member hours and percentages.</summary>
        Task<object> GetPlanSummaryAsync(int planId);
    }
}
