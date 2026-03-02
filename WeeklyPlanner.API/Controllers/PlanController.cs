using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WeeklyPlanner.API.Models;
using WeeklyPlanner.API.Services;

namespace WeeklyPlanner.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PlanController : ControllerBase
    {
        private readonly IWeeklyPlanService _planService;

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
    }
}
