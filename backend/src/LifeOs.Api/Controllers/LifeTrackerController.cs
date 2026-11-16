using LifeOs.Application.LifeTracker.DTOs;
using LifeOs.Application.LifeTracker.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LifeOs.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/life-tracker")]
[Route("api/life-tracker")]
public class LifeTrackerController(ILifeTrackerService lifeTrackerService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<LifeMetricDetailDto>>> GetMetrics(
        [FromQuery] string? areaSlug,
        CancellationToken cancellationToken)
    {
        var list = await lifeTrackerService.GetMetricsAsync(areaSlug, cancellationToken);
        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<LifeMetricDetailDto>> Create(
        [FromBody] SaveLifeMetricRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Unit))
        {
            return BadRequest("Nome e unidade de medida são obrigatórios.");
        }

        var created = await lifeTrackerService.CreateAsync(request, cancellationToken);
        return Created($"/api/v1/life-tracker/{created.Id}", created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<LifeMetricDetailDto>> Update(
        Guid id,
        [FromBody] SaveLifeMetricRequest request,
        CancellationToken cancellationToken)
    {
        var updated = await lifeTrackerService.UpdateAsync(id, request, cancellationToken);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpPost("{id:guid}/adjust")]
    public async Task<ActionResult<LifeMetricDetailDto>> AdjustValue(
        Guid id,
        [FromBody] AdjustMetricValueRequest request,
        CancellationToken cancellationToken)
    {
        var updated = await lifeTrackerService.AdjustValueAsync(id, request, cancellationToken);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpPost("{id:guid}/set")]
    public async Task<ActionResult<LifeMetricDetailDto>> SetValue(
        Guid id,
        [FromBody] SetMetricValueRequest request,
        CancellationToken cancellationToken)
    {
        var updated = await lifeTrackerService.SetValueAsync(id, request, cancellationToken);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await lifeTrackerService.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
