namespace WeeklyPlanner.API.Models
{
    public class BacklogItem
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Category { get; set; } // Client / TechDebt / R&D
        public int EstimatedHours { get; set; }
    }
}