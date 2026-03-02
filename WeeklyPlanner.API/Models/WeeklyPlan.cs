using System;

namespace WeeklyPlanner.API.Models
{
    public class WeeklyPlan
    {
        public int Id { get; set; }
        public DateTime StartDate { get; set; }
        public int TotalPlannedHours { get; set; }
    }
}