using System.Text.Json.Serialization;

namespace WeeklyPlanner.API.Models
{
    public class TaskAssignment
    {
        public int Id { get; set; }
        public int WeeklyPlanId { get; set; }
        public int TeamMemberId { get; set; }
        public int BacklogItemId { get; set; }
        public int PlannedHours { get; set; }

        // Navigation property - populated via Include() in queries
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public BacklogItem? BacklogItem { get; set; }
    }
}
