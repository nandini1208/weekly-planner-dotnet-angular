using System;

namespace WeeklyPlanner.API.Models
{
    public class WeeklyPlan
    {
        public int Id { get; set; }
        public DateTime StartDate { get; set; }
        public int TotalPlannedHours { get; set; }
        public int ClientPercentage { get; set; }
        public int TechDebtPercentage { get; set; }
        public int RnDPercentage { get; set; }
        public bool IsFrozen { get; set; }
    }
}