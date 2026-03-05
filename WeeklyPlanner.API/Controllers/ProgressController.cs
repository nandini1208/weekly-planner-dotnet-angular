using Microsoft.AspNetCore.Mvc;
using WeeklyPlanner.API.Models;
using WeeklyPlanner.API.Services;

namespace WeeklyPlanner.API.Controllers
{
    /// <summary>
    /// Handles task progress updates and retrieval of member/team progress for the weekly plan.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class ProgressController : ControllerBase
    {
        private readonly IWeeklyPlanService _planService;

        /// <summary>Injects the weekly plan service dependency.</summary>
        public ProgressController(IWeeklyPlanService planService)
        {
            _planService = planService;
        }

        /// <summary>
        /// POST api/Progress/update
        /// Updates the completedHours and status for a specific task assignment.
        /// Also syncs the BacklogItem's status to reflect current progress.
        /// </summary>
        [HttpPost("update")]
        public async Task<ActionResult<ProgressUpdate>> UpdateProgress([FromBody] ProgressUpdateRequest request)
        {
            try
            {
                var update = await _planService.UpdateProgressAsync(request.AssignmentId, request.CompletedHours, request.Status);
                return Ok(update);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// GET api/Progress/member/{memberId}/plan/{planId}
        /// Returns a member's assigned tasks with their latest progress update for the given plan.
        /// </summary>
        [HttpGet("member/{memberId}/plan/{planId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetMemberProgress(int memberId, int planId)
        {
            var result = await _planService.GetMemberProgressAsync(memberId, planId);
            return Ok(result);
        }

        /// <summary>
        /// GET api/Progress/plan/{planId}/team
        /// Returns progress for all members in the plan. Used by the Lead's "Team Progress" view.
        /// </summary>
        [HttpGet("plan/{planId}/team")]
        public async Task<ActionResult<IEnumerable<object>>> GetTeamProgress(int planId)
        {
            var result = await _planService.GetTeamProgressAsync(planId);
            return Ok(result);
        }
    }

    /// <summary>Request body model for updating task assignment progress.</summary>
    public class ProgressUpdateRequest
    {
        /// <summary>The ID of the TaskAssignment to update.</summary>
        public int AssignmentId { get; set; }

        /// <summary>Number of hours completed on this task so far.</summary>
        public int CompletedHours { get; set; }

        /// <summary>Current status: "To Do", "In Progress", "Done", or "Blocked".</summary>
        public string Status { get; set; } = string.Empty;
    }
}

