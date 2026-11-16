using LifeOs.Application.Dashboard.DTOs;
using LifeOs.Application.Dashboard.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LifeOs.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/dashboard")]
public class DashboardController(IDashboardService dashboardService) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryDto>> GetSummary(
        [FromQuery] string? areaSlug,
        [FromQuery] string? priority,
        [FromQuery] string? status,
        [FromQuery] string? search,
        CancellationToken cancellationToken)
    {
        var filter = new DashboardFilterQuery(areaSlug, priority, status, search);
        var summary = await dashboardService.GetSummaryAsync(filter, cancellationToken);
        return Ok(summary);
    }

    [HttpPatch("tasks/{id:guid}/toggle")]
    public async Task<ActionResult<DashboardTaskItemDto>> ToggleTaskStatus(Guid id, CancellationToken cancellationToken)
    {
        var updated = await dashboardService.ToggleTaskStatusAsync(id, cancellationToken);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpPatch("events/{id:guid}/toggle")]
    public async Task<ActionResult<DashboardEventItemDto>> ToggleEventStatus(Guid id, CancellationToken cancellationToken)
    {
        var updated = await dashboardService.ToggleEventStatusAsync(id, cancellationToken);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpPost("quick-capture")]
    public async Task<ActionResult> QuickCapture([FromBody] QuickCaptureRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new { message = "O título é obrigatório." });
        }

        await dashboardService.QuickCaptureAsync(request, cancellationToken);
        return Created("/api/v1/dashboard/summary", new { message = "Registrado com sucesso." });
    }
}
