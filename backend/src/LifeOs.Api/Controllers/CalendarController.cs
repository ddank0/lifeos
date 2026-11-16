using LifeOs.Application.Calendar.DTOs;
using LifeOs.Application.Calendar.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LifeOs.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/calendar")]
[Route("api/calendar")]
public class CalendarController(ICalendarService calendarService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CalendarEntryDto>>> GetEntries(
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        [FromQuery] Guid? areaId,
        [FromQuery] string? areaSlug,
        [FromQuery] string? entryType,
        CancellationToken cancellationToken)
    {
        var rangeFrom = from ?? DateTimeOffset.UtcNow.AddDays(-15);
        var rangeTo = to ?? DateTimeOffset.UtcNow.AddDays(45);
        var filter = new CalendarQueryFilter(rangeFrom, rangeTo, areaId, areaSlug, entryType);
        var entries = await calendarService.GetEntriesAsync(filter, cancellationToken);
        return Ok(entries);
    }

    [HttpPatch("reschedule")]
    public async Task<ActionResult> Reschedule(
        [FromBody] RescheduleCalendarEntryRequest request,
        CancellationToken cancellationToken)
    {
        if (request.SourceId == Guid.Empty || string.IsNullOrWhiteSpace(request.EntryType))
        {
            return BadRequest("Dados inválidos para reagendamento.");
        }

        var updated = await calendarService.RescheduleAsync(request, cancellationToken);
        return updated ? Ok(new { updated = true }) : NotFound();
    }
}
