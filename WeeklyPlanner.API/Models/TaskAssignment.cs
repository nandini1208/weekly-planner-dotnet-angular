using System.Text.Json.Serialization;

namespace WeeklyPlanner.API.Models
{
    /// <summary>
    /// Records which team member has committed to a specific backlog item within a weekly plan,
    /// and how many hours they plan to spend on it. Each assignment automatically receives
    /// an initial ProgressUpdate with status "To Do" upon creation.
    /// </summary>
    public class TaskAssignment
    {
        /// <summary>Primary key.</summary>
        public int Id { get; set; }

        /// <summary>Foreign key – the weekly plan this assignment belongs to.</summary>
        public int WeeklyPlanId { get; set; }

        /// <summary>Foreign key – the team member who picked up this task.</summary>
        public int TeamMemberId { get; set; }

        /// <summary>Foreign key – the backlog item being worked on.</summary>
        public int BacklogItemId { get; set; }

        /// <summary>Number of hours the member plans to spend on this task this week (max 30h total per member).</summary>
        public int PlannedHours { get; set; }

        /// <summary>
        /// Navigation property – the associated BacklogItem.
        /// Populated via .Include() in EF Core queries. Excluded from JSON serialization when null
        /// to avoid circular reference issues.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public BacklogItem? BacklogItem { get; set; }
    }
}
