namespace WeeklyPlanner.API.Models
{
    public class TaskAssignment
    {
        public int Id { get; set; }
        public int WeeklyPlanId { get; set; }
        public int TeamMemberId { get; set; }
        public int BacklogItemId { get; set; }
        public int PlannedHours { get; set; }
    }
}