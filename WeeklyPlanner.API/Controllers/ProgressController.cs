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
    }

    public class ProgressUpdateRequest
    {
        public int AssignmentId { get; set; }
        public int CompletedHours { get; set; }
        public string Status { get; set; }
    }
}
