namespace WeeklyPlanner.API.Models
{
    /// <summary>
    /// Represents a unit of work in the backlog. Items are classified into three categories:
    /// Client Focused, Tech Debt, or R&amp;D. The status reflects whether the item is
    /// available to be picked up, currently in progress, or completed.
    /// </summary>
    public class BacklogItem
    {
        /// <summary>Primary key.</summary>
        public int Id { get; set; }

        /// <summary>Short description of the task.</summary>
        public string Title { get; set; } = string.Empty;

        /// <summary>Longer description of the work to be done.</summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>Work category: "Client Focused", "Tech Debt", or "R&amp;D".</summary>
        public string Category { get; set; } = string.Empty;

        /// <summary>Estimated effort in hours for this backlog item.</summary>
        public int EstimatedHours { get; set; }

        /// <summary>
        /// Current status of the backlog item.
        /// Possible values: "Available", "To Do", "In Progress", "Blocked", "Done".
        /// Updated automatically when a team member updates their progress.
        /// </summary>
        public string Status { get; set; } = "Available";
    }
}