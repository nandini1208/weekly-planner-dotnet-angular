namespace WeeklyPlanner.API.Models
{
    public class ProgressUpdate
    {
        public int Id { get; set; }
        public int TaskAssignmentId { get; set; }
        public int CompletedHours { get; set; }
        public string Status { get; set; }
        public DateTime UpdateDate { get; set; } = DateTime.UtcNow;
    }
}