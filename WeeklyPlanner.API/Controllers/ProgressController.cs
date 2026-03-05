using Microsoft.AspNetCore.Mvc;
using WeeklyPlanner.API.Models;
using WeeklyPlanner.API.Services;

namespace WeeklyPlanner.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProgressController : ControllerBase
    {
        private readonly IWeeklyPlanService _planService;

        public ProgressController(IWeeklyPlanService planService)
        {
            _planService = planService;
        }

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

        // GET: api/Progress/member/5/plan/3
        [HttpGet("member/{memberId}/plan/{planId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetMemberProgress(int memberId, int planId)
        {
            var result = await _planService.GetMemberProgressAsync(memberId, planId);
            return Ok(result);
        }

        // GET: api/Progress/plan/3/team  (Lead's full team view)
        [HttpGet("plan/{planId}/team")]
        public async Task<ActionResult<IEnumerable<object>>> GetTeamProgress(int planId)
        {
            var result = await _planService.GetTeamProgressAsync(planId);
            return Ok(result);
        }
    }

    public class ProgressUpdateRequest
    {
        public int AssignmentId { get; set; }
        public int CompletedHours { get; set; }
        public string Status { get; set; }
    }
}
