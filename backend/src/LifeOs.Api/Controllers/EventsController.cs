using LifeOs.Application.Events.DTOs;
using LifeOs.Application.Events.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LifeOs.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/events")]
public class EventsController(IEventService eventService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<EventDetailDto>>> GetEvents(
        [FromQuery] Guid? areaId,
        [FromQuery] string? areaSlug,
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        CancellationToken cancellationToken)
    {
        var filter = new EventQueryFilter(areaId, areaSlug, from, to);
        var list = await eventService.GetEventsAsync(filter, cancellationToken);
        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<EventDetailDto>> CreateEvent([FromBody] SaveEventRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new { message = "O título do evento é obrigatório." });
        }

        var created = await eventService.CreateAsync(request, cancellationToken);
        return Created($"/api/v1/events/{created.Id}", created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<EventDetailDto>> UpdateEvent(Guid id, [FromBody] SaveEventRequest request, CancellationToken cancellationToken)
    {
        var updated = await eventService.UpdateAsync(id, request, cancellationToken);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteEvent(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await eventService.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
