using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WeeklyPlanner.API.Models;
using WeeklyPlanner.API.Services;

namespace WeeklyPlanner.API.Controllers
{
    /// <summary>
    /// Manages weekly plans including creation, freezing, task assignments, and summaries.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class PlanController : ControllerBase
    {
        private readonly IWeeklyPlanService _planService;

        /// <summary>Injects the weekly plan service dependency.</summary>
        public PlanController(IWeeklyPlanService planService)
        {
            _planService = planService;
        }

        // POST: api/Plan
        [HttpPost]
        public async Task<ActionResult<WeeklyPlan>> CreatePlan(WeeklyPlan plan)
        {
            try
            {
                var createdPlan = await _planService.CreatePlanAsync(plan);
                return Ok(createdPlan);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // POST: api/Plan/5/freeze
        [HttpPost("{id}/freeze")]
        public async Task<IActionResult> FreezePlan(int id)
        {
            try
            {
                var plan = await _planService.FreezePlanAsync(id);
                return Ok(plan);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        // POST: api/Plan/assign
        [HttpPost("assign")]
        public async Task<ActionResult<TaskAssignment>> AddAssignment(TaskAssignment assignment)
        {
            try
            {
                var createdAssignment = await _planService.AddAssignmentAsync(assignment);
                return Ok(createdAssignment);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        // GET: api/Plan
        [HttpGet]
        public async Task<ActionResult<IEnumerable<WeeklyPlan>>> GetPlans()
        {
            var plans = await _planService.GetPlansAsync();
            return Ok(plans);
        }

        // DELETE: api/Plan/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePlan(int id)
        {
            try
            {
                await _planService.DeletePlanAsync(id);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        // GET: api/Plan/5/assignments
        [HttpGet("{id}/assignments")]
        public async Task<ActionResult<IEnumerable<TaskAssignment>>> GetAssignments(int id)
        {
            var assignments = await _planService.GetAssignmentsByPlanIdAsync(id);
            return Ok(assignments);
        }

        // DELETE: api/Plan/5/assignments/member/12
        [HttpDelete("{planId}/assignments/member/{memberId}")]
        public async Task<IActionResult> DeleteMemberAssignments(int planId, int memberId)
        {
            await _planService.DeleteAssignmentsByMemberAsync(planId, memberId);
            return NoContent();
        }

        // GET: api/Plan/5/summary
        [HttpGet("{id}/summary")]
        public async Task<ActionResult<object>> GetPlanSummary(int id)
        {
            try
            {
                var summary = await _planService.GetPlanSummaryAsync(id);
                return Ok(summary);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}
