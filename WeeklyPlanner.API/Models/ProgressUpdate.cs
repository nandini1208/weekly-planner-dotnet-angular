namespace WeeklyPlanner.API.Models
{
    /// <summary>
    /// Records a progress snapshot for a task assignment at a point in time.
    /// Multiple updates can exist per assignment; the most recent one is used to
    /// determine current status and hours completed.
    /// </summary>
    public class ProgressUpdate
    {
        /// <summary>Primary key.</summary>
        public int Id { get; set; }

        /// <summary>Foreign key – the task assignment this progress update belongs to.</summary>
        public int TaskAssignmentId { get; set; }

        /// <summary>Total hours completed on this task as of this update.</summary>
        public int CompletedHours { get; set; }

        /// <summary>
        /// Current status of the task.
        /// Possible values: "To Do", "In Progress", "Blocked", "Done".
        /// </summary>
        public string Status { get; set; } = "To Do";

        /// <summary>UTC timestamp of when this progress update was recorded.</summary>
        public DateTime UpdateDate { get; set; } = DateTime.UtcNow;
    }
}