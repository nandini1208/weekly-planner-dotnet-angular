namespace WeeklyPlanner.API.Models
{
    /// <summary>
    /// Represents a person on the team. One member is designated as the Team Lead
    /// and has additional privileges (setting plan percentages, freezing plans, viewing team progress).
    /// </summary>
    public class TeamMember
    {
        /// <summary>Primary key.</summary>
        public int Id { get; set; }

        /// <summary>Display name of the team member.</summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>True if this member is the current Team Lead. Only one lead exists at a time.</summary>
        public bool IsLead { get; set; }
    }
}