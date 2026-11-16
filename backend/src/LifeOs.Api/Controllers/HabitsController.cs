using LifeOs.Application.Habits.DTOs;
using LifeOs.Application.Habits.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LifeOs.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/habits")]
[Route("api/habits")]
public class HabitsController(IHabitService habitService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<HabitDetailDto>>> GetHabits(
        [FromQuery] string? areaSlug = null,
        CancellationToken cancellationToken = default)
    {
        var list = await habitService.GetHabitsAsync(areaSlug, cancellationToken);
        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<HabitDetailDto>> CreateHabit(
        [FromBody] SaveHabitRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("O nome do hábito é obrigatório.");
        }

        var created = await habitService.CreateAsync(request, cancellationToken);
        return Created($"/api/v1/habits/{created.Id}", created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<HabitDetailDto>> UpdateHabit(
        Guid id,
        [FromBody] SaveHabitRequest request,
        CancellationToken cancellationToken = default)
    {
        var updated = await habitService.UpdateAsync(id, request, cancellationToken);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpPost("{id:guid}/toggle")]
    public async Task<ActionResult<HabitDetailDto>> ToggleCompletion(
        Guid id,
        [FromBody] ToggleHabitCompletionRequest request,
        CancellationToken cancellationToken = default)
    {
        var updated = await habitService.ToggleCompletionAsync(id, request, cancellationToken);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteHabit(Guid id, CancellationToken cancellationToken = default)
    {
        var deleted = await habitService.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
