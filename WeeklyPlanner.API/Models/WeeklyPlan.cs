using System;

namespace WeeklyPlanner.API.Models
{
    /// <summary>
    /// Represents a weekly planning period. Created each Tuesday by the Team Lead,
    /// specifying the category budget percentages. Once frozen, no new assignments can be added.
    /// </summary>
    public class WeeklyPlan
    {
        /// <summary>Primary key.</summary>
        public int Id { get; set; }

        /// <summary>The Tuesday on which planning opens for this week (Wednesday–Monday work period).</summary>
        public DateTime StartDate { get; set; }

        /// <summary>Total hours planned across all team members for the week.</summary>
        public int TotalPlannedHours { get; set; }

        /// <summary>Percentage of the weekly budget allocated to Client-Focused work (0–100).</summary>
        public int ClientPercentage { get; set; }

        /// <summary>Percentage of the weekly budget allocated to Tech Debt work (0–100).</summary>
        public int TechDebtPercentage { get; set; }

        /// <summary>Percentage of the weekly budget allocated to R&amp;D work (0–100).</summary>
        public int RnDPercentage { get; set; }

        /// <summary>True once the lead freezes the plan. Members can only update progress after this point.</summary>
        public bool IsFrozen { get; set; }

        /// <summary>True once the lead closes the week. This archives the plan and resets unfinished items.</summary>
        public bool IsCompleted { get; set; }
    }
}